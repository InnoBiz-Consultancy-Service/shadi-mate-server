import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import AppError from "../helpers/AppError";
import { isAccessTokenBlacklisted, verifyAccessToken } from "./token.utils";
import { getCachedUser, setCachedUser, TCachedUser } from "./user.cache";
import { User } from "../app/modules/user/user.model";


/**
 * authenticate middleware — 4 step flow:
 *
 *  1. JWT signature + expiry verify
 *  2. Redis blacklist check (revoked tokens)
 *  3. Redis cache check → fresh user data (cache hit: ~1ms)
 *  4. Cache miss → DB query → populate cache (cache miss: ~5-10ms)
 *
 * Result: req.user ALWAYS has live data — subscription, role, isBlocked
 * are never stale regardless of when the JWT was issued.
 */
const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
    try {
        // ── Step 1: Extract & verify JWT ─────────────────────────────────────
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith("Bearer ")) {
            throw new AppError(StatusCodes.UNAUTHORIZED, "No token provided");
        }

        const token = authHeader.split(" ")[1];
        const decoded = verifyAccessToken(token); // throws if expired/invalid

        // ── Step 2: Redis blacklist check (logout / revoked tokens) ──────────
        const jti = token.split(".")[2]; // JWT signature as unique ID
        const blacklisted = await isAccessTokenBlacklisted(jti);

        if (blacklisted) {
            throw new AppError(
                StatusCodes.UNAUTHORIZED,
                "Token has been revoked. Please login again"
            );
        }

        // ── Step 3: Try Redis cache first ────────────────────────────────────
        let freshUser: TCachedUser | null = await getCachedUser(decoded.id);

        // ── Step 4: Cache miss → hit DB, then warm cache ─────────────────────
        if (!freshUser) {
            const dbUser = await User.findById(decoded.id)
                .select("role isVerified isProfileCompleted subscription isBlocked isDeleted")
                .lean();

            if (!dbUser) {
                throw new AppError(StatusCodes.UNAUTHORIZED, "User not found");
            }

            freshUser = {
                _id: String(dbUser._id),
                role: dbUser.role,
                isVerified: dbUser.isVerified,
                isProfileCompleted: dbUser.isProfileCompleted as boolean,
                subscription: dbUser.subscription,
                isBlocked: dbUser.isBlocked,
                isDeleted: dbUser.isDeleted,
            };

            // Warm the cache for subsequent requests
            await setCachedUser(freshUser);
        }

        // ── Step 5: Guard checks on fresh data ───────────────────────────────
        if (freshUser.isDeleted) {
            throw new AppError(StatusCodes.UNAUTHORIZED, "Account no longer exists");
        }

        if (freshUser.isBlocked) {
            throw new AppError(
                StatusCodes.FORBIDDEN,
                "Your account has been blocked"
            );
        }

        if (!freshUser.isVerified) {
            throw new AppError(
                StatusCodes.FORBIDDEN,
                "Please verify your account first"
            );
        }

        // ── Step 6: Attach LIVE user data to request ──────────────────────────
        req.user = freshUser;

        next();
    } catch (err) {
        next(err);
    }
};

export default authenticate;
