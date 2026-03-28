"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LikeService = exports.invalidateProfileCache = void 0;
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../../helpers/AppError"));
const redis_1 = require("../../../utils/redis");
const like_model_1 = require("./like.model");
const user_model_1 = require("../user/user.model");
const profile_model_1 = require("../profile/profile.model");
// ─── Cache Keys ──────────────────────────────────────────────────────────────
const LIKE_COUNT_KEY = (userId) => `like:count:${userId}`;
const LIKE_SENDERS_KEY = (userId) => `like:senders:${userId}`;
const MY_LIKES_KEY = (userId) => `like:given:${userId}`;
const PROFILE_CACHE_KEY = (userId) => `profile:${userId}`;
const LIKE_LIST_TTL = 60 * 5;
const PROFILE_CACHE_TTL = 60 * 10;
const PROFILE_SELECT_FIELDS = "userId gender birthDate profession economicalStatus personality religion address education aboutMe height skinTone";
const batchGetProfiles = (userIds) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userIds.length)
        return {};
    const profileMap = {};
    const cacheKeys = userIds.map(PROFILE_CACHE_KEY);
    let cachedValues = [];
    try {
        cachedValues = yield redis_1.redisClient.mget(...cacheKeys);
    }
    catch (_) {
        cachedValues = new Array(userIds.length).fill(null);
    }
    const missingUserIds = [];
    userIds.forEach((userId, idx) => {
        const raw = cachedValues[idx];
        if (raw !== null) {
            try {
                profileMap[userId] = JSON.parse(raw);
            }
            catch (_) {
                missingUserIds.push(userId);
            }
        }
        else {
            missingUserIds.push(userId);
        }
    });
    if (missingUserIds.length > 0) {
        const profiles = yield profile_model_1.Profile.find({ userId: { $in: missingUserIds } })
            .select(PROFILE_SELECT_FIELDS)
            .populate("userId", "name _id")
            .populate("address.divisionId", "name")
            .populate("address.districtId", "name")
            .lean();
        const pipeline = redis_1.redisClient.pipeline();
        for (const profile of profiles) {
            const uid = profile.userId._id.toString();
            profileMap[uid] = profile;
            pipeline.setex(PROFILE_CACHE_KEY(uid), PROFILE_CACHE_TTL, JSON.stringify(profile));
        }
        try {
            yield pipeline.exec();
        }
        catch (_) { }
    }
    return profileMap;
});
const invalidateProfileCache = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield redis_1.redisClient.del(PROFILE_CACHE_KEY(userId));
    }
    catch (_) { }
});
exports.invalidateProfileCache = invalidateProfileCache;
const toggleLike = (fromUserId, toUserId) => __awaiter(void 0, void 0, void 0, function* () {
    if (fromUserId === toUserId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "You cannot like your own profile");
    }
    const targetUser = yield user_model_1.User.findOne({
        _id: toUserId,
        isDeleted: false,
        isBlocked: false,
    }).lean();
    if (!targetUser) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    const existingLike = yield like_model_1.Like.findOne({ fromUserId, toUserId });
    let action;
    if (existingLike) {
        yield like_model_1.Like.deleteOne({ _id: existingLike._id });
        action = "unliked";
    }
    else {
        yield like_model_1.Like.create({ fromUserId, toUserId });
        action = "liked";
    }
    yield Promise.all([
        redis_1.redisClient.del(LIKE_COUNT_KEY(toUserId)),
        redis_1.redisClient.del(LIKE_SENDERS_KEY(toUserId)),
        redis_1.redisClient.del(MY_LIKES_KEY(fromUserId)),
    ]);
    return { action };
});
const getLikeCount = (targetUserId) => __awaiter(void 0, void 0, void 0, function* () {
    const cacheKey = LIKE_COUNT_KEY(targetUserId);
    try {
        const cached = yield redis_1.redisClient.get(cacheKey);
        if (cached !== null)
            return { count: parseInt(cached) };
    }
    catch (_) { }
    const count = yield like_model_1.Like.countDocuments({ toUserId: targetUserId });
    try {
        yield redis_1.redisClient.setex(cacheKey, LIKE_LIST_TTL, count.toString());
    }
    catch (_) { }
    return { count };
});
const getWhoLikedMe = (userId, subscription) => __awaiter(void 0, void 0, void 0, function* () {
    if (subscription !== "premium") {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Upgrade to premium to see who liked your profile");
    }
    const cacheKey = LIKE_SENDERS_KEY(userId);
    try {
        const cached = yield redis_1.redisClient.get(cacheKey);
        if (cached !== null)
            return JSON.parse(cached);
    }
    catch (_) { }
    const likes = yield like_model_1.Like.find({ toUserId: userId })
        .sort({ createdAt: -1 })
        .lean();
    const senderIds = likes.map((l) => l.fromUserId.toString());
    const profileMap = yield batchGetProfiles(senderIds);
    const result = likes.map((like) => {
        var _a;
        return ({
            userId: like.fromUserId.toString(),
            likedAt: like.createdAt,
            profile: (_a = profileMap[like.fromUserId.toString()]) !== null && _a !== void 0 ? _a : null,
        });
    });
    try {
        yield redis_1.redisClient.setex(cacheKey, LIKE_LIST_TTL, JSON.stringify(result));
    }
    catch (_) { }
    return result;
});
const getMyLikes = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const cacheKey = MY_LIKES_KEY(userId);
    try {
        const cached = yield redis_1.redisClient.get(cacheKey);
        if (cached !== null)
            return JSON.parse(cached);
    }
    catch (_) { }
    const likes = yield like_model_1.Like.find({ fromUserId: userId })
        .sort({ createdAt: -1 })
        .lean();
    const targetIds = likes.map((l) => l.toUserId.toString());
    const profileMap = yield batchGetProfiles(targetIds);
    const result = likes.map((like) => {
        var _a;
        return ({
            userId: like.toUserId.toString(),
            likedAt: like.createdAt,
            profile: (_a = profileMap[like.toUserId.toString()]) !== null && _a !== void 0 ? _a : null,
        });
    });
    try {
        yield redis_1.redisClient.setex(cacheKey, LIKE_LIST_TTL, JSON.stringify(result));
    }
    catch (_) { }
    return result;
});
exports.LikeService = {
    toggleLike,
    getLikeCount,
    getWhoLikedMe,
    getMyLikes,
};
