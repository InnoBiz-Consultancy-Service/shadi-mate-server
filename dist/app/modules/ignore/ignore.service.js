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
exports.IgnoreService = void 0;
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../../helpers/AppError"));
const ignore_model_1 = require("./ignore.model");
const user_model_1 = require("../user/user.model");
// ─── Toggle Ignore / Unignore ─────────────────────────────────────────────────
const toggleIgnore = (userId, ignoredUserId) => __awaiter(void 0, void 0, void 0, function* () {
    if (userId === ignoredUserId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "You cannot ignore yourself");
    }
    const targetUser = yield user_model_1.User.findOne({ _id: ignoredUserId, isDeleted: false }).lean();
    if (!targetUser)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    const existing = yield ignore_model_1.Ignore.findOne({ userId, ignoredUserId });
    let action;
    if (existing) {
        yield ignore_model_1.Ignore.deleteOne({ _id: existing._id });
        action = "unignored";
    }
    else {
        yield ignore_model_1.Ignore.create({ userId, ignoredUserId });
        action = "ignored";
    }
    return { action };
});
const isIgnoredBy = (senderId, receiverId) => __awaiter(void 0, void 0, void 0, function* () {
    const record = yield ignore_model_1.Ignore.findOne({ userId: receiverId, ignoredUserId: senderId }).lean();
    return !!record;
});
// ─── Save Ignored Message ─────────────────────────────────────────────────────
const saveIgnoredMessage = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    return yield ignore_model_1.IgnoredMessage.create({
        senderId: payload.senderId,
        receiverId: payload.receiverId,
        content: payload.content,
        type: payload.type,
        status: "sent",
        isRead: false,
    });
});
// ─── Ignored Conversation List ────────────────────────────────────────────────
const getIgnoredConversationList = (receiverId) => __awaiter(void 0, void 0, void 0, function* () {
    const conversations = yield ignore_model_1.IgnoredMessage.aggregate([
        { $match: { receiverId: { $eq: receiverId } } },
        { $sort: { createdAt: -1 } },
        {
            $group: {
                _id: "$senderId",
                lastMessage: { $first: "$content" },
                lastMessageType: { $first: "$type" },
                lastMessageTime: { $first: "$createdAt" },
                unreadCount: { $sum: { $cond: [{ $eq: ["$isRead", false] }, 1, 0] } },
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "senderInfo",
            },
        },
        { $unwind: { path: "$senderInfo", preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 0,
                userId: "$_id",
                name: "$senderInfo.name",
                lastMessage: 1,
                lastMessageType: 1,
                lastMessageTime: 1,
                unreadCount: 1,
            },
        },
        { $sort: { lastMessageTime: -1 } },
    ]);
    return conversations;
});
// ─── Get Ignored Messages from a specific sender ──────────────────────────────
const getIgnoredMessagesFromSender = (receiverId_1, senderId_1, ...args_1) => __awaiter(void 0, [receiverId_1, senderId_1, ...args_1], void 0, function* (receiverId, senderId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [messages, total] = yield Promise.all([
        ignore_model_1.IgnoredMessage.find({ receiverId, senderId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        ignore_model_1.IgnoredMessage.countDocuments({ receiverId, senderId }),
    ]);
    yield ignore_model_1.IgnoredMessage.updateMany({ receiverId, senderId, isRead: false }, { isRead: true });
    return {
        messages: messages.reverse(),
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
});
// ─── Delete Ignored Messages from a sender ────────────────────────────────────
const deleteIgnoredMessagesFromSender = (receiverId, senderId) => __awaiter(void 0, void 0, void 0, function* () {
    yield ignore_model_1.IgnoredMessage.deleteMany({ receiverId, senderId });
    return { message: "Ignored messages deleted" };
});
// ─── Get My Ignore List ───────────────────────────────────────────────────────
const getMyIgnoreList = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const ignores = yield ignore_model_1.Ignore.find({ userId })
        .sort({ createdAt: -1 })
        .populate("ignoredUserId", "name _id")
        .lean();
    return ignores.map((ig) => ({
        userId: ig.ignoredUserId._id,
        name: ig.ignoredUserId.name,
        ignoredAt: ig.createdAt,
    }));
});
// ─── Check Ignore Status ──────────────────────────────────────────────────────
const checkIgnoreStatus = (userId, targetUserId) => __awaiter(void 0, void 0, void 0, function* () {
    const record = yield ignore_model_1.Ignore.findOne({ userId, ignoredUserId: targetUserId }).lean();
    return { isIgnored: !!record };
});
exports.IgnoreService = {
    toggleIgnore,
    isIgnoredBy,
    saveIgnoredMessage,
    getIgnoredConversationList,
    getIgnoredMessagesFromSender,
    deleteIgnoredMessagesFromSender,
    getMyIgnoreList,
    checkIgnoreStatus,
};
