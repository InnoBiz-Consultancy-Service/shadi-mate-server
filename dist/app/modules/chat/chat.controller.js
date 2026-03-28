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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConversationList = exports.getChatHistory = void 0;
const mongoose_1 = require("mongoose");
const chat_model_1 = require("./chat.model");
const catchAsync_1 = require("../../../utils/catchAsync");
const sendResponse_1 = require("../../../utils/sendResponse");
// ─── GET /api/v1/chat/:userId ─────────────────────────────────────────────────
exports.getChatHistory = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const myId = new mongoose_1.Types.ObjectId(user.id);
    const otherUserId = new mongoose_1.Types.ObjectId(req.params.userId);
    if (user.subscription !== "premium") {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: 403,
            success: false,
            message: "Upgrade to premium to view chat history",
        });
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const filter = {
        $or: [
            { senderId: myId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: myId },
        ],
    };
    const [messages, total] = yield Promise.all([
        chat_model_1.Message.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        chat_model_1.Message.countDocuments(filter),
    ]);
    yield chat_model_1.Message.updateMany({ senderId: otherUserId, receiverId: myId, status: { $ne: "seen" } }, { status: "seen" });
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
    const isPremium = user.subscription === "premium";
    const conversations = yield chat_model_1.Message.aggregate([
        {
            $match: {
                $or: [{ senderId: myId }, { receiverId: myId }],
            },
        },
        { $sort: { createdAt: -1 } },
        {
            $addFields: {
                otherUser: {
                    $cond: [{ $eq: ["$senderId", myId] }, "$receiverId", "$senderId"],
                },
            },
        },
        {
            $group: {
                _id: "$otherUser",
                lastMessage: { $first: "$content" },
                lastMessageType: { $first: "$type" },
                lastMessageTime: { $first: "$createdAt" },
                status: { $first: "$status" },
                unreadCount: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $eq: ["$receiverId", myId] },
                                    { $ne: ["$status", "seen"] },
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "userInfo",
            },
        },
        { $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 0,
                userId: "$_id",
                name: "$userInfo.name",
                avatar: "$userInfo.avatar",
                lastMessage: 1,
                lastMessageType: 1,
                lastMessageTime: 1,
                status: 1,
                unreadCount: 1,
            },
        },
        { $sort: { lastMessageTime: -1 } },
    ]);
    const result = conversations.map((conv) => {
        if (!isPremium) {
            return Object.assign(Object.assign({}, conv), { lastMessage: null, lastMessageType: null, isLocked: true });
        }
        return Object.assign(Object.assign({}, conv), { isLocked: false });
    });
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: 200,
        success: true,
        message: "Conversations fetched successfully",
        data: result,
    });
}));
