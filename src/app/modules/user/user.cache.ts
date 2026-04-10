import redisClient from "./redis.client";

// ─── Constants ────────────────────────────────────────────────────────────────
const USER_CACHE_PREFIX = "user:";
const USER_CACHE_TTL = 300; // 5 minutes

// ─── Types ────────────────────────────────────────────────────────────────────
export type TCachedUser = {
    _id: string;
    role: string;
    isVerified: boolean;
    isProfileCompleted: boolean;
    subscription: string;
    isBlocked: boolean;
    isDeleted: boolean;
};

// ─── Get Cached User ──────────────────────────────────────────────────────────
export const getCachedUser = async (userId: string): Promise<TCachedUser | null> => {
    try {
        const cached = await redisClient.get(`${USER_CACHE_PREFIX}${userId}`);
        return cached ? JSON.parse(cached) : null;
    } catch {
        return null; // Redis failure → fallback to DB, never crash
    }
};

// ─── Set User Cache ───────────────────────────────────────────────────────────
export const setCachedUser = async (user: TCachedUser): Promise<void> => {
    try {
        await redisClient.setEx(
            `${USER_CACHE_PREFIX}${user._id}`,
            USER_CACHE_TTL,
            JSON.stringify(user)
        );
    } catch {
        // Silent fail — cache is best-effort
    }
};

// ─── Invalidate User Cache ────────────────────────────────────────────────────
// Call this whenever user data changes:
// - subscription update
// - role change
// - block/unblock
// - profile completion
export const invalidateUserCache = async (userId: string): Promise<void> => {
    try {
        await redisClient.del(`${USER_CACHE_PREFIX}${userId}`);
    } catch {
        // Silent fail
    }
};
