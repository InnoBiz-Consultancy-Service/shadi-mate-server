// src/middleware/rateLimiter.ts
import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redisClient from "../utils/redis";
import { Request, Response } from "express";

// ─── Helper: Structured 429 response ─────────────────────────────────────────
const tooManyRequestsResponse = (message: string) => ({
  success: false,
  statusCode: 429,
  message,
});

// ─── Improved: Client IP detection (Proxy support) ───────────────────────────
const getClientIP = (req: Request): string => {
  // Cloudflare
  const cfIP = req.headers['cf-connecting-ip'];
  if (cfIP && typeof cfIP === 'string') return cfIP;
  
  // Standard proxy headers
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded && typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  
  // Nginx real IP
  const realIP = req.headers['x-real-ip'];
  if (realIP && typeof realIP === 'string') return realIP;
  
  // Fallback to Express IP
  return req.ip || '127.0.0.1';
};

// ─── Improved: Phone/Identifier detection ────────────────────────────────────
const getIdentifier = (req: Request): string => {
  // Body থেকে (JSON)
  if (req.body?.phone) return String(req.body.phone);
  if (req.body?.identifier) return String(req.body.identifier);
  if (req.body?.email) return String(req.body.email);
  
  // Query parameters থেকে (GET request)
  if (req.query?.phone) return String(req.query.phone);
  if (req.query?.identifier) return String(req.query.identifier);
  
  // URL params থেকে
  if (req.params?.phone) return String(req.params.phone);
  
  // Headers থেকে
  if (req.headers['x-phone-number']) return String(req.headers['x-phone-number']);
  
  return 'unknown';
};

// ─── Fixed: Redis Store with proper configuration ──────────────────────────────
const buildStore = (prefix: string) => {
  // Check if Redis is connected
  const isRedisReady = redisClient && redisClient.isOpen;
  
  if (isRedisReady) {
    try {
      console.log(`✅ Creating Redis store for: ${prefix}`);
      
      // ✅ Correct way for newer version of rate-limit-redis
      return new RedisStore({
        sendCommand: (...args: string[]) => redisClient.sendCommand(args),
        prefix: `rl:${prefix}:`,
      });
    } catch (err) {
      console.error(`❌ Failed to create Redis store for ${prefix}:`, err);
    }
  }
  
  // Fallback to memory store with warning
  console.warn(`⚠️ Redis not connected — rate limiter "${prefix}" using in-memory store (won't work across multiple instances)`);
  return undefined; // express-rate-limit will use memory store
};

// ═════════════════════════════════════════════════════════════════════════════
// 1. GLOBAL IP FALLBACK
// ─────────────────────────────────────────────────────────────────────────────
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per 15 minutes
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  store: buildStore("global"),
  keyGenerator: (req: Request) => getClientIP(req),
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/v1/health';
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json(
      tooManyRequestsResponse(
        "Too many requests from this IP. Please wait 15 minutes before trying again."
      )
    );
  },
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. AUTHENTICATED USER LIMITER
// ─────────────────────────────────────────────────────────────────────────────
export const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore("user"),
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.id;
    if (userId) return `user:${userId}`;
    return getClientIP(req);
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json(
      tooManyRequestsResponse(
        "You've made too many requests. Please wait 15 minutes before continuing."
      )
    );
  },
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. BURST LIMITER — Auth routes only
// ─────────────────────────────────────────────────────────────────────────────
export const burstLimiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 20, // 20 requests per second
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore("burst"),
  keyGenerator: (req: Request) => getClientIP(req),
  handler: (_req: Request, res: Response) => {
    res.status(429).json(
      tooManyRequestsResponse(
        "Too many requests in a short time. Please slow down."
      )
    );
  },
});

// ═════════════════════════════════════════════════════════════════════════════
// 4. REGISTER LIMITER
// ─────────────────────────────────────────────────────────────────────────────
export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 registration attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore("register"),
  keyGenerator: (req: Request) => getClientIP(req),
  handler: (_req: Request, res: Response) => {
    res.status(429).json(
      tooManyRequestsResponse(
        "Too many registration attempts. Please wait 15 minutes before trying again."
      )
    );
  },
});

// ═════════════════════════════════════════════════════════════════════════════
// 5. LOGIN LIMITER (Brute force protection)
// ─────────────────────────────────────────────────────────────────────────────
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore("login"),
  keyGenerator: (req: Request) => {
    const identifier = getIdentifier(req);
    const ip = getClientIP(req);
    // IP + identifier combination for better security
    return identifier !== 'unknown' ? `${ip}:${identifier}` : ip;
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json(
      tooManyRequestsResponse(
        "Too many login attempts. Please wait 15 minutes before trying again."
      )
    );
  },
});

// ═════════════════════════════════════════════════════════════════════════════
// 6. OTP LIMITER (SMS abuse prevention)
// ─────────────────────────────────────────────────────────────────────────────
export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 OTP requests per 10 minutes
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore("otp"),
  keyGenerator: (req: Request) => {
    const ip = getClientIP(req);
    const identifier = getIdentifier(req);
    const key = `${ip}:${identifier}`;
    
    // Debug log (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔑 OTP Rate Limit Key: ${key}`);
      console.log(`   IP: ${ip}, Identifier: ${identifier}`);
    }
    
    return key;
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json(
      tooManyRequestsResponse(
        "Too many OTP requests. Please wait 10 minutes before requesting again."
      )
    );
  },
});

// ═════════════════════════════════════════════════════════════════════════════
// 7. FORGOT PASSWORD LIMITER
// ─────────────────────────────────────────────────────────────────────────────
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore("forgot-password"),
  keyGenerator: (req: Request) => {
    const identifier = getIdentifier(req);
    const ip = getClientIP(req);
    return identifier !== 'unknown' ? `${ip}:${identifier}` : ip;
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json(
      tooManyRequestsResponse(
        "Too many password reset requests. Please wait 1 hour before trying again."
      )
    );
  },
});

// ═════════════════════════════════════════════════════════════════════════════
// 8. PROFILE SEARCH LIMITER
// ─────────────────────────────────────────────────────────────────────────────
export const profileSearchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 searches per minute
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore("profile-search"),
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.id;
    return userId ? `user:${userId}` : getClientIP(req);
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json(
      tooManyRequestsResponse(
        "You're browsing too fast. Please wait a moment before continuing."
      )
    );
  },
});

// ═════════════════════════════════════════════════════════════════════════════
// 9. LIKE/UNLIKE LIMITER
// ─────────────────────────────────────────────────────────────────────────────
export const likeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 likes per minute
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore("like"),
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.id;
    return userId ? `user:${userId}` : getClientIP(req);
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json(
      tooManyRequestsResponse(
        "You're liking too fast. Please slow down."
      )
    );
  },
});

// ═════════════════════════════════════════════════════════════════════════════
// 10. PAYMENT/SUBSCRIPTION LIMITER
// ─────────────────────────────────────────────────────────────────────────────
export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 payment attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore("payment"),
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.id;
    return userId ? `user:${userId}` : getClientIP(req);
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json(
      tooManyRequestsResponse(
        "Too many payment attempts. Please wait 1 hour before trying again."
      )
    );
  },
});

// ═════════════════════════════════════════════════════════════════════════════
// 11. REPORT SUBMISSION LIMITER
// ─────────────────────────────────────────────────────────────────────────────
export const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 reports per hour
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore("report"),
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.id;
    return userId ? `user:${userId}` : getClientIP(req);
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json(
      tooManyRequestsResponse(
        "You've submitted too many reports. Please wait 1 hour before submitting again."
      )
    );
  },
});

// ═════════════════════════════════════════════════════════════════════════════
// 12. ALBUM/PHOTO LIMITER
// ─────────────────────────────────────────────────────────────────────────────
export const albumLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore("album"),
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.id;
    return userId ? `user:${userId}` : getClientIP(req);
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json(
      tooManyRequestsResponse(
        "Too many photo requests. Please wait 15 minutes before trying again."
      )
    );
  },
});

// ═════════════════════════════════════════════════════════════════════════════
// 13. MESSAGE SENDING LIMITER (NEW)
// ─────────────────────────────────────────────────────────────────────────────
export const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 messages per minute
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore("message"),
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.id;
    return userId ? `user:${userId}` : getClientIP(req);
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json(
      tooManyRequestsResponse(
        "You're sending messages too fast. Please slow down."
      )
    );
  },
});

// ═════════════════════════════════════════════════════════════════════════════
// 14. API KEY LIMITER (for external services)
// ─────────────────────────────────────────────────────────────────────────────
export const apiKeyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per API key
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore("api-key"),
  keyGenerator: (req: Request) => {
    const apiKey = req.headers['x-api-key'] as string;
    return apiKey || getClientIP(req);
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json(
      tooManyRequestsResponse(
        "API rate limit exceeded. Please wait a moment."
      )
    );
  },
});