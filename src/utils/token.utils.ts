import jwt, { JwtPayload } from "jsonwebtoken";
import crypto from "crypto";
import redisClient from "./redis";
import { envVars } from "../config/envConfig";

// ─── Constants ────────────────────────────────────────────────────────────────
export const ACCESS_TOKEN_EXPIRY = "2d";
export const REFRESH_TOKEN_EXPIRY_SECONDS = 30 * 24 * 60 * 60; // 30 days in seconds

// Redis key prefixes
const REFRESH_TOKEN_PREFIX = "refresh:";
const BLACKLIST_PREFIX = "blacklist:";

// ─── Types ────────────────────────────────────────────────────────────────────
export type TTokenPayload = {
    id: string;
    role: string;
    isVerified: boolean;
    isProfileCompleted: boolean;
    subscription: string;
    gender?: string;
};

// ─── Build Minimal Payload ────────────────────────────────────────────────────
// ❌ phone & email intentionally excluded — PII should never go in JWT
export const buildTokenPayload = (user: {
  _id: unknown;
  role: string;
  isVerified: boolean;
  isProfileCompleted: boolean;
  subscription: string;
  gender?: string; 
}) => ({
  id: String(user._id),
  role: user.role,
  isVerified: user.isVerified,
  isProfileCompleted: user.isProfileCompleted,
  subscription: user.subscription,
  gender: user.gender ?? "", 
});
// ─── Sign Access Token (15 min) ───────────────────────────────────────────────
export const signAccessToken = (payload: TTokenPayload): string =>
    jwt.sign(payload, envVars.JWT_SECRET as string, {
        expiresIn: ACCESS_TOKEN_EXPIRY,
    });

// ─── Sign & Store Refresh Token (7 days, Redis) ───────────────────────────────
export const signRefreshToken = async (userId: string): Promise<string> => {
    // Opaque random token — NOT a JWT so payload cannot be decoded
    const refreshToken = crypto.randomBytes(64).toString("hex");

    await redisClient.setEx(
        `${REFRESH_TOKEN_PREFIX}${userId}`,
        REFRESH_TOKEN_EXPIRY_SECONDS,
        refreshToken
    );

    return refreshToken;
};

// ─── Verify Refresh Token Against Redis ──────────────────────────────────────
export const verifyRefreshToken = async (
    userId: string,
    token: string
): Promise<boolean> => {
    const stored = await redisClient.get(`${REFRESH_TOKEN_PREFIX}${userId}`);
    return stored === token;
};

// ─── Rotate Refresh Token ────────────────────────────────────────────────────
// Old token deleted, new one issued — prevents replay attacks
export const rotateRefreshToken = async (userId: string): Promise<string> => {
    await redisClient.del(`${REFRESH_TOKEN_PREFIX}${userId}`);
    return signRefreshToken(userId);
};

// ─── Blacklist Access Token (Logout) ─────────────────────────────────────────
export const blacklistAccessToken = async (
    jti: string,
    expiresIn: number // remaining TTL in seconds
): Promise<void> => {
    await redisClient.setEx(`${BLACKLIST_PREFIX}${jti}`, expiresIn, "1");
};

// ─── Check if Access Token is Blacklisted ────────────────────────────────────
export const isAccessTokenBlacklisted = async (jti: string): Promise<boolean> => {
    const result = await redisClient.get(`${BLACKLIST_PREFIX}${jti}`);
    return result === "1";
};

// ─── Revoke Refresh Token (Logout) ───────────────────────────────────────────
export const revokeRefreshToken = async (userId: string): Promise<void> => {
    await redisClient.del(`${REFRESH_TOKEN_PREFIX}${userId}`);
};

// ─── Verify & Decode Access Token ────────────────────────────────────────────
export const verifyAccessToken = (token: string): JwtPayload & TTokenPayload => {
    return jwt.verify(token, envVars.JWT_SECRET as string) as JwtPayload & TTokenPayload;
};