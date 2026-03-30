import { StatusCodes } from "http-status-codes";
import AppError from "../../../helpers/AppError";
import { redisClient } from "../../../utils/redis";
import { Like } from "./like.model";
import { User } from "../user/user.model";
import { Profile } from "../profile/profile.model";
import { NotificationService } from "../notification/notification.service";
import { getIO } from "../../../socket/handlers/socketSingleton";


// ─── Cache Keys ──────────────────────────────────────────────────────────────
const LIKE_COUNT_KEY = (userId: string) => `like:count:${userId}`;
const LIKE_SENDERS_KEY = (userId: string) => `like:senders:${userId}`;
const MY_LIKES_KEY = (userId: string) => `like:given:${userId}`;
const PROFILE_CACHE_KEY = (userId: string) => `profile:${userId}`;

const LIKE_LIST_TTL = 60 * 5;
const PROFILE_CACHE_TTL = 60 * 10;

const PROFILE_SELECT_FIELDS =
    "userId gender birthDate profession economicalStatus personality religion address education aboutMe height skinTone";

// ─── Helper: Batch profile fetch ─────────────────────────────────────────────
const batchGetProfiles = async (userIds: string[]) => {
    if (!userIds.length) return {};

    const profileMap: Record<string, any> = {};
    const cacheKeys = userIds.map(PROFILE_CACHE_KEY);
    let cachedValues: (string | null)[] = [];

    try {
        cachedValues = await redisClient.mget(...cacheKeys);
    } catch (_) {
        cachedValues = new Array(userIds.length).fill(null);
    }

    const missingUserIds: string[] = [];

    userIds.forEach((userId, idx) => {
        const raw = cachedValues[idx];
        if (raw !== null) {
            try {
                profileMap[userId] = JSON.parse(raw);
            } catch (_) {
                missingUserIds.push(userId);
            }
        } else {
            missingUserIds.push(userId);
        }
    });

    if (missingUserIds.length > 0) {
        const profiles = await Profile.find({ userId: { $in: missingUserIds } })
            .select(PROFILE_SELECT_FIELDS)
            .populate("userId", "name _id")
            .populate("address.divisionId", "name")
            .populate("address.districtId", "name")
            .lean();

        const pipeline = redisClient.pipeline();

        for (const profile of profiles) {
            const uid = (profile.userId as any)._id.toString();
            profileMap[uid] = profile;
            pipeline.setex(PROFILE_CACHE_KEY(uid), PROFILE_CACHE_TTL, JSON.stringify(profile));
        }

        try {
            await pipeline.exec();
        } catch (_) { }
    }

    return profileMap;
};

// ─── Profile Cache Invalidate ─────────────────────────────────────────────────
export const invalidateProfileCache = async (userId: string) => {
    try {
        await redisClient.del(PROFILE_CACHE_KEY(userId));
    } catch (_) { }
};

// ─── Toggle Like / Unlike ─────────────────────────────────────────────────────
const toggleLike = async (fromUserId: string, toUserId: string) => {
    if (fromUserId === toUserId) {
        throw new AppError(StatusCodes.BAD_REQUEST, "You cannot like your own profile");
    }

    const targetUser = await User.findOne({
        _id: toUserId,
        isDeleted: false,
        isBlocked: false,
    }).lean();

    if (!targetUser) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }

    const existingLike = await Like.findOne({ fromUserId, toUserId });

    let action: "liked" | "unliked";

    if (existingLike) {
        // ─── Unlike ───────────────────────────────────────────────────────────
        await Like.deleteOne({ _id: existingLike._id });
        action = "unliked";
    } else {
        // ─── Like ─────────────────────────────────────────────────────────────
        await Like.create({ fromUserId, toUserId });
        action = "liked";


        try {
            const sender = await User.findById(fromUserId).select("name").lean();
            const senderName = sender?.name ?? "Someone";

            await NotificationService.createAndDeliver({
                io: getIO(),
                redisClient,
                recipientId: toUserId,
                senderId: fromUserId,
                senderName,
                type: "like",
                metadata: {
                    conversationWith: fromUserId,
                },
            });
        } catch (err) {
            // Notification fail হলেও like action block হবে না
            console.error("❌ Like notification error:", err);
        }
    }

    // ─── Cache invalidate ─────────────────────────────────────────────────────
    await Promise.all([
        redisClient.del(LIKE_COUNT_KEY(toUserId)),
        redisClient.del(LIKE_SENDERS_KEY(toUserId)),
        redisClient.del(MY_LIKES_KEY(fromUserId)),
    ]);

    return { action };
};

// ─── Get Like Count ───────────────────────────────────────────────────────────
const getLikeCount = async (targetUserId: string) => {
    const cacheKey = LIKE_COUNT_KEY(targetUserId);

    try {
        const cached = await redisClient.get(cacheKey);
        if (cached !== null) return { count: parseInt(cached) };
    } catch (_) { }

    const count = await Like.countDocuments({ toUserId: targetUserId });

    try {
        await redisClient.setex(cacheKey, LIKE_LIST_TTL, count.toString());
    } catch (_) { }

    return { count };
};

// ─── Get Who Liked Me (Premium Only) ─────────────────────────────────────────
const getWhoLikedMe = async (userId: string, subscription: string) => {
    if (subscription !== "premium") {
        throw new AppError(
            StatusCodes.FORBIDDEN,
            "Upgrade to premium to see who liked your profile"
        );
    }

    const cacheKey = LIKE_SENDERS_KEY(userId);

    try {
        const cached = await redisClient.get(cacheKey);
        if (cached !== null) return JSON.parse(cached);
    } catch (_) { }

    const likes = await Like.find({ toUserId: userId })
        .sort({ createdAt: -1 })
        .lean();

    const senderIds = likes.map((l: any) => l.fromUserId.toString());
    const profileMap = await batchGetProfiles(senderIds);

    const result = likes.map((like: any) => ({
        userId: like.fromUserId.toString(),
        likedAt: like.createdAt,
        profile: profileMap[like.fromUserId.toString()] ?? null,
    }));

    try {
        await redisClient.setex(cacheKey, LIKE_LIST_TTL, JSON.stringify(result));
    } catch (_) { }

    return result;
};

// ─── Get My Given Likes ───────────────────────────────────────────────────────
const getMyLikes = async (userId: string) => {
    const cacheKey = MY_LIKES_KEY(userId);

    try {
        const cached = await redisClient.get(cacheKey);
        if (cached !== null) return JSON.parse(cached);
    } catch (_) { }

    const likes = await Like.find({ fromUserId: userId })
        .sort({ createdAt: -1 })
        .lean();

    const targetIds = likes.map((l: any) => l.toUserId.toString());
    const profileMap = await batchGetProfiles(targetIds);

    const result = likes.map((like: any) => ({
        userId: like.toUserId.toString(),
        likedAt: like.createdAt,
        profile: profileMap[like.toUserId.toString()] ?? null,
    }));

    try {
        await redisClient.setex(cacheKey, LIKE_LIST_TTL, JSON.stringify(result));
    } catch (_) { }

    return result;
};

export const LikeService = {
    toggleLike,
    getLikeCount,
    getWhoLikedMe,
    getMyLikes,
};