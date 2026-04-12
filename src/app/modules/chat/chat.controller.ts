import { Request, Response } from "express";
import { Types } from "mongoose";
import { Message, Conversation } from "./chat.model";
import { catchAsync } from "../../../utils/catchAsync";
import { sendResponse } from "../../../utils/sendResponse";
import AppError from "../../../helpers/AppError";
import { StatusCodes } from "http-status-codes";

// ─── Helper ───────────────────────────────────────────────────────────────────
const isValidObjectId = (id: string): boolean => Types.ObjectId.isValid(id);

// ─── GET /api/v1/chat/:userId ─────────────────────────────────────────────────
export const getChatHistory = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;

    if (!isValidObjectId(req.params.userId)) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Invalid user ID");
    }

    if (user.subscription !== "premium") {
        throw new AppError(StatusCodes.FORBIDDEN, "Upgrade to premium to view chat history");
    }

    const myId    = new Types.ObjectId(user.id);
    const otherId = new Types.ObjectId(req.params.userId);

    if (myId.equals(otherId)) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Cannot chat with yourself");
    }

    const page  = Math.max(1, parseInt(req.query.page  as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip  = (page - 1) * limit;

    const filter = {
        $or: [
            { senderId: myId,    receiverId: otherId },
            { senderId: otherId, receiverId: myId   },
        ],
    };

    const [messages, total] = await Promise.all([
        Message.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Message.countDocuments(filter),
    ]);

    // ── Mark as seen + Conversation sync ─────────────────────────────────────
    // getChatHistory খুললে মানে user conversation দেখছে → সব seen হওয়া উচিত
    const participantKey = [user.id, otherId.toString()].sort().join("_");

    await Promise.all([
        // Message collection-এ সব pending message seen করো
        Message.updateMany(
            { senderId: otherId, receiverId: myId, status: { $ne: "seen" } },
            { status: "seen" }
        ),
        // Conversation-এ unread count reset + lastMessageStatus sync
        // Bug fix: আগে শুধু unreadCount reset হতো, lastMessageStatus "seen" হতো না
        Conversation.updateOne(
            {
                participantKey,
                // শুধু তখনই seen করো যখন last message অন্যজনের পাঠানো
                lastMessageSenderId: otherId,
            },
            {
                $set: {
                    lastMessageStatus:             "seen",
                    [`unreadCounts.${user.id}`]:    0,
                },
            }
        ),
    ]);

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
    const user      = (req as any).user;
    const myId      = new Types.ObjectId(user.id);
    const isPremium = user.subscription === "premium";

    const conversations = await Conversation.find({ participantIds: myId })
        .sort({ lastMessageAt: -1 })
        .populate("participantIds", "name avatar")
        .lean();

    const result = conversations.map((conv) => {
        const otherUser = (conv.participantIds as any[]).find(
            (p: any) => p?._id?.toString() !== user.id
        );

        const unreadCount =
            (conv.unreadCounts as Record<string, number>)?.[user.id] ?? 0;

        const base = {
            userId:          otherUser?._id    ?? null,
            name:            otherUser?.name   ?? null,
            avatar:          otherUser?.avatar ?? null,
            lastMessageTime: conv.lastMessageAt,
            unreadCount,
        };

        if (!isPremium) {
            return { ...base, lastMessage: null, lastMessageType: null, isLocked: true };
        }

        return {
            ...base,
            lastMessage:     conv.lastMessage,
            lastMessageType: conv.lastMessageType,
            status:          conv.lastMessageStatus,
            isLocked:        false,
        };
    });

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Conversations fetched successfully",
        data: result,
    });
});