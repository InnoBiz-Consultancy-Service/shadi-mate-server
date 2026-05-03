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
exports.getConversationList = exports.getChatHistory = void 0;
const mongoose_1 = require("mongoose");
const chat_model_1 = require("./chat.model");
const catchAsync_1 = require("../../../utils/catchAsync");
const sendResponse_1 = require("../../../utils/sendResponse");
const AppError_1 = __importDefault(require("../../../helpers/AppError"));
const http_status_codes_1 = require("http-status-codes");
// ─── Helper ───────────────────────────────────────────────────────────────────
const isValidObjectId = (id) => mongoose_1.Types.ObjectId.isValid(id);
// ─── GET /api/v1/chat/:userId ─────────────────────────────────────────────────
exports.getChatHistory = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    if (!isValidObjectId(req.params.userId)) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid user ID");
    }
    const myId = new mongoose_1.Types.ObjectId(user.id);
    const otherId = new mongoose_1.Types.ObjectId(req.params.userId);
    if (myId.equals(otherId)) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Cannot chat with yourself");
    }
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const filter = {
        $or: [
            { senderId: myId, receiverId: otherId },
            { senderId: otherId, receiverId: myId },
        ],
    };
    const [messages, total] = yield Promise.all([
        chat_model_1.Message.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        chat_model_1.Message.countDocuments(filter),
    ]);
    // ── Mark as seen + Conversation sync ─────────────────────────────────────
    const participantKey = [user.id, otherId.toString()].sort().join("_");
    yield Promise.all([
        chat_model_1.Message.updateMany({ senderId: otherId, receiverId: myId, status: { $ne: "seen" } }, { status: "seen" }),
        chat_model_1.Conversation.updateOne({
            participantKey,
            lastMessageSenderId: otherId,
        }, {
            $set: {
                lastMessageStatus: "seen",
                [`unreadCounts.${user.id}`]: 0,
            },
        }),
    ]);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: 200,
        success: true,
        message: "Chat history fetched successfully",
        data: messages.reverse(),
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
}));
// ─── GET /api/v1/chat/conversations ──────────────────────────────────────────
exports.getConversationList = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const myId = new mongoose_1.Types.ObjectId(user.id);
    const conversations = yield chat_model_1.Conversation.find({ participantIds: myId })
        .sort({ lastMessageAt: -1 })
        .populate("participantIds", "name avatar")
        .lean();
    const result = conversations.map((conv) => {
        var _a, _b, _c, _d, _e;
        const otherUser = conv.participantIds.find((p) => { var _a; return ((_a = p === null || p === void 0 ? void 0 : p._id) === null || _a === void 0 ? void 0 : _a.toString()) !== user.id.toString(); });
        const unreadCount = (_b = (_a = conv.unreadCounts) === null || _a === void 0 ? void 0 : _a[user.id]) !== null && _b !== void 0 ? _b : 0;
        const base = {
            userId: (_c = otherUser === null || otherUser === void 0 ? void 0 : otherUser._id) !== null && _c !== void 0 ? _c : null,
            name: (_d = otherUser === null || otherUser === void 0 ? void 0 : otherUser.name) !== null && _d !== void 0 ? _d : null,
            avatar: (_e = otherUser === null || otherUser === void 0 ? void 0 : otherUser.avatar) !== null && _e !== void 0 ? _e : null,
            lastMessageTime: conv.lastMessageAt,
            unreadCount,
        };
        return Object.assign(Object.assign({}, base), { lastMessage: conv.lastMessage, lastMessageType: conv.lastMessageType, status: conv.lastMessageStatus, isLocked: false });
    });
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: 200,
        success: true,
        message: "Conversations fetched successfully",
        data: result,
    });
}));
