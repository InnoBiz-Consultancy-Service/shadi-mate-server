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
exports.ProfileVisitService = void 0;
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../../helpers/AppError"));
const profileVisit_model_1 = require("./profileVisit.model");
const user_model_1 = require("../user/user.model");
const notification_service_1 = require("../notification/notification.service");
const redis_1 = require("../../../utils/redis");
const socketSingleton_1 = require("../../../socket/handlers/socketSingleton");
// ─── Record Profile Visit ─────────────────────────────────────────────────────
// profile.service.ts এর getProfileById থেকে call হবে
const recordVisit = (visitorId, profileOwnerId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // নিজের profile visit log হবে না
    if (visitorId === profileOwnerId)
        return;
    // ─── Upsert: same visitor+owner থাকলে visitCount++ এবং visitedAt update ──
    yield profileVisit_model_1.ProfileVisit.findOneAndUpdate({ visitorId, profileOwnerId }, {
        $inc: { visitCount: 1 },
        $set: { visitedAt: new Date() },
    }, { upsert: true, new: true });
    // ─── Profile owner কে notification পাঠাও ─────────────────────────────────
    try {
        const visitor = yield user_model_1.User.findById(visitorId).select("name").lean();
        const visitorName = (_a = visitor === null || visitor === void 0 ? void 0 : visitor.name) !== null && _a !== void 0 ? _a : "Someone";
        yield notification_service_1.NotificationService.createAndDeliver({
            io: (0, socketSingleton_1.getIO)(),
            redisClient: redis_1.redisClient,
            recipientId: profileOwnerId,
            senderId: visitorId,
            senderName: visitorName,
            type: "profile_visit",
            metadata: {
                conversationWith: visitorId,
            },
        });
    }
    catch (err) {
        // Notification fail হলেও visit log block হবে না
        console.error("❌ Profile visit notification error:", err);
    }
});
// ─── Get Who Visited My Profile (Premium Only) ───────────────────────────────
const getProfileVisitors = (profileOwnerId_1, subscription_1, ...args_1) => __awaiter(void 0, [profileOwnerId_1, subscription_1, ...args_1], void 0, function* (profileOwnerId, subscription, page = 1, limit = 20) {
    if (subscription !== "premium") {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Upgrade to premium to see who visited your profile");
    }
    const skip = (page - 1) * limit;
    const [visitors, total] = yield Promise.all([
        profileVisit_model_1.ProfileVisit.find({ profileOwnerId })
            .sort({ visitedAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("visitorId", "name _id")
            .lean(),
        profileVisit_model_1.ProfileVisit.countDocuments({ profileOwnerId }),
    ]);
    const result = visitors.map((v) => ({
        userId: v.visitorId._id,
        name: v.visitorId.name,
        visitCount: v.visitCount,
        visitedAt: v.visitedAt,
    }));
    return {
        visitors: result,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
});
// ─── Get Total Visit Count (Free & Premium) ───────────────────────────────────
const getVisitCount = (profileOwnerId) => __awaiter(void 0, void 0, void 0, function* () {
    const count = yield profileVisit_model_1.ProfileVisit.countDocuments({ profileOwnerId });
    return { count };
});
exports.ProfileVisitService = {
    recordVisit,
    getProfileVisitors,
    getVisitCount,
};
