import { Request, Response } from "express";
import { Message } from "./chat.model";
import { catchAsync } from "../../../utils/catchAsync";
import { sendResponse } from "../../../utils/sendResponse";



// ─── GET /api/chat/history/:userId ───────────────────────────────────────────
// Returns full message history between the logged-in user and another user
export const getChatHistory = catchAsync(async (req: Request, res: Response) => {
    const myId = (req as any).user.id;          // from auth middleware
    const otherUserId = req.params.userId;

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
            .sort({ createdAt: -1 })   // newest first
            .skip(skip)
            .limit(limit)
            .lean(),
        Message.countDocuments(filter),
    ]);

    // Mark unread messages (sent to me) as "seen"
    await Message.updateMany(
        { senderId: otherUserId, receiverId: myId, status: { $ne: "seen" } },
        { status: "seen" }
    );

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Chat history fetched successfully",
        data: messages.reverse(), // return oldest first
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        } as any,
    });
});

// ─── GET /api/chat/conversations ─────────────────────────────────────────────
// Returns last message per conversation for the logged-in user
export const getConversationList = catchAsync(async (req: Request, res: Response) => {
    const myId = (req as any).user.id;

    const conversations = await Message.aggregate([
        // Only messages involving me
        {
            $match: {
                $or: [{ senderId: myId }, { receiverId: myId }],
            },
        },
        // Sort newest first before grouping
        { $sort: { createdAt: -1 } },
        // Determine the "other" user in the conversation
        {
            $addFields: {
                otherUser: {
                    $cond: [{ $eq: ["$senderId", myId] }, "$receiverId", "$senderId"],
                },
            },
        },
        // Group by the other user → keep only the latest message
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
                            { $and: [{ $eq: ["$receiverId", myId] }, { $ne: ["$status", "seen"] }] },
                            1,
                            0,
                        ],
                    },
                },
            },
        },
        // Lookup other user's profile
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "userInfo",
            },
        },
        { $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true } },
        // Shape the response
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

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Conversations fetched successfully",
        data: conversations,
    });
});