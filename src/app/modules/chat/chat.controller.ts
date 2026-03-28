import { Request, Response } from "express";
import { Types } from "mongoose";
import { Message } from "./chat.model";
import { catchAsync } from "../../../utils/catchAsync";
import { sendResponse } from "../../../utils/sendResponse";

// ─── GET /api/v1/chat/:userId ─────────────────────────────────────────────────
export const getChatHistory = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const myId = new Types.ObjectId(user.id);
    const otherUserId = new Types.ObjectId(req.params.userId);

    if (user.subscription !== "premium") {
        return sendResponse(res, {
            statusCode: 403,
            success: false,
            message: "Upgrade to premium to view chat history",
        });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const filter = {
        $or: [
            { senderId: myId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: myId },
        ],
    };

    const [messages, total] = await Promise.all([
        Message.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Message.countDocuments(filter),
    ]);

    await Message.updateMany(
        { senderId: otherUserId, receiverId: myId, status: { $ne: "seen" } },
        { status: "seen" }
    );

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Chat history fetched successfully",
        data: messages.reverse(),
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) } as any,
    });
});

// ─── GET /api/v1/chat/conversations ──────────────────────────────────────────
export const getConversationList = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const myId = new Types.ObjectId(user.id);
    const isPremium = user.subscription === "premium";

    const conversations = await Message.aggregate([
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
            return {
                ...conv,
                lastMessage: null,
                lastMessageType: null,
                isLocked: true,
            };
        }
        return { ...conv, isLocked: false };
    });

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Conversations fetched successfully",
        data: result,
    });
});