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
    // countDocuments + find একসাথে — parallel
    const [messages, total] = yield Promise.all([
        chat_model_1.Message.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        chat_model_1.Message.countDocuments(filter),
    ]);
    const participantKey = [user.id, otherId.toString()].sort().join("_");
    // Mark seen + conversation sync — parallel
    yield Promise.all([
        chat_model_1.Message.updateMany({ senderId: otherId, receiverId: myId, status: { $ne: "seen" } }, { status: "seen" }),
        chat_model_1.Conversation.updateOne({ participantKey, lastMessageSenderId: otherId }, {
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
// ─── CHANGE 4: GET /api/v1/chat/conversations — populate() সরিয়ে aggregation ──
// আগে: Conversation.find().populate("participantIds") → N+1 query problem
//       50 conversations থাকলে 51 DB queries হতো
// এখন: একটাই aggregation pipeline — $lookup দিয়ে User data join করে
//       50 conversations হলেও মাত্র 1 DB query
// Result: p95 1098ms → ~300ms হবে
exports.getConversationList = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const myId = new mongoose_1.Types.ObjectId(user.id);
    // ─── Single aggregation — populate() এর বদলে ─────────────────────────────
    const conversations = yield chat_model_1.Conversation.aggregate([
        // Step 1: আমার conversations খোঁজো
        {
            $match: {
                participantIds: myId,
            },
        },
        // Step 2: সর্বশেষ message সময় অনুযায়ী sort
        {
            $sort: { lastMessageAt: -1 },
        },
        // Step 3: participants এর user data join (populate এর বদলে)
        // আগে populate করলে প্রতিটা participant এর জন্য আলাদা DB query হতো
        // এখন একটা $lookup এ সব User data আসছে
        {
            $lookup: {
                from: "users",
                localField: "participantIds",
                foreignField: "_id",
                as: "participantDetails",
                // শুধু দরকারী fields নিচ্ছি — less data transfer
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        // Step 4: শুধু দরকারী fields রাখো — response size কমাও
        {
            $project: {
                _id: 1,
                participantIds: 1,
                participantDetails: 1,
                lastMessage: 1,
                lastMessageType: 1,
                lastMessageSenderId: 1,
                lastMessageAt: 1,
                lastMessageStatus: 1,
                unreadCounts: 1,
            },
        },
    ]);
    // ─── Result format করো ───────────────────────────────────────────────────
    const result = conversations.map((conv) => {
        var _a, _b, _c, _d, _e, _f;
        // Other participant খোঁজো (আমি না যে)
        const otherUser = (_a = conv.participantDetails) === null || _a === void 0 ? void 0 : _a.find((p) => { var _a; return ((_a = p === null || p === void 0 ? void 0 : p._id) === null || _a === void 0 ? void 0 : _a.toString()) !== user.id.toString(); });
        const unreadCount = (_c = (_b = conv.unreadCounts) === null || _b === void 0 ? void 0 : _b[user.id]) !== null && _c !== void 0 ? _c : 0;
        return {
            userId: (_d = otherUser === null || otherUser === void 0 ? void 0 : otherUser._id) !== null && _d !== void 0 ? _d : null,
            name: (_e = otherUser === null || otherUser === void 0 ? void 0 : otherUser.name) !== null && _e !== void 0 ? _e : null,
            avatar: (_f = otherUser === null || otherUser === void 0 ? void 0 : otherUser.avatar) !== null && _f !== void 0 ? _f : null,
            lastMessageTime: conv.lastMessageAt,
            unreadCount,
            lastMessage: conv.lastMessage,
            lastMessageType: conv.lastMessageType,
            status: conv.lastMessageStatus,
            isLocked: false,
        };
    });
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: 200,
        success: true,
        message: "Conversations fetched successfully",
        data: result,
    });
}));
