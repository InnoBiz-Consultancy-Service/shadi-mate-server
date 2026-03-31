import { StatusCodes } from "http-status-codes";
import AppError from "../../../helpers/AppError";
import { Ignore, IgnoredMessage } from "./ignore.model";
import { User } from "../user/user.model";

// ─── Toggle Ignore / Unignore ─────────────────────────────────────────────────
const toggleIgnore = async (userId: string, ignoredUserId: string) => {
    if (userId === ignoredUserId) {
        throw new AppError(StatusCodes.BAD_REQUEST, "You cannot ignore yourself");
    }

    const targetUser = await User.findOne({ _id: ignoredUserId, isDeleted: false }).lean();
    if (!targetUser) throw new AppError(StatusCodes.NOT_FOUND, "User not found");

    const existing = await Ignore.findOne({ userId, ignoredUserId });
    let action: "ignored" | "unignored";

    if (existing) {
        await Ignore.deleteOne({ _id: existing._id });
        action = "unignored";
    } else {
        await Ignore.create({ userId, ignoredUserId });
        action = "ignored";
    }

    return { action };
};

const isIgnoredBy = async (senderId: string, receiverId: string): Promise<boolean> => {
    const record = await Ignore.findOne({ userId: receiverId, ignoredUserId: senderId }).lean();
    return !!record;
};

// ─── Save Ignored Message ─────────────────────────────────────────────────────
const saveIgnoredMessage = async (payload: {
    senderId: string;
    receiverId: string;
    content: string;
    type: string;
}) => {
    return await IgnoredMessage.create({
        senderId: payload.senderId,
        receiverId: payload.receiverId,
        content: payload.content,
        type: payload.type,
        status: "sent",
        isRead: false,
    });
};

// ─── Ignored Conversation List ────────────────────────────────────────────────
const getIgnoredConversationList = async (receiverId: string) => {
    const conversations = await IgnoredMessage.aggregate([
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
};

// ─── Get Ignored Messages from a specific sender ──────────────────────────────
const getIgnoredMessagesFromSender = async (
    receiverId: string,
    senderId: string,
    page = 1,
    limit = 20
) => {
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
        IgnoredMessage.find({ receiverId, senderId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        IgnoredMessage.countDocuments({ receiverId, senderId }),
    ]);

    await IgnoredMessage.updateMany(
        { receiverId, senderId, isRead: false },
        { isRead: true }
    );

    return {
        messages: messages.reverse(),
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
};

// ─── Delete Ignored Messages from a sender ────────────────────────────────────
const deleteIgnoredMessagesFromSender = async (receiverId: string, senderId: string) => {
    await IgnoredMessage.deleteMany({ receiverId, senderId });
    return { message: "Ignored messages deleted" };
};

// ─── Get My Ignore List ───────────────────────────────────────────────────────
const getMyIgnoreList = async (userId: string) => {
    const ignores = await Ignore.find({ userId })
        .sort({ createdAt: -1 })
        .populate("ignoredUserId", "name _id")
        .lean();

    return ignores.map((ig: any) => ({
        userId: ig.ignoredUserId._id,
        name: ig.ignoredUserId.name,
        ignoredAt: ig.createdAt,
    }));
};

// ─── Check Ignore Status ──────────────────────────────────────────────────────
const checkIgnoreStatus = async (userId: string, targetUserId: string) => {
    const record = await Ignore.findOne({ userId, ignoredUserId: targetUserId }).lean();
    return { isIgnored: !!record };
};

export const IgnoreService = {
    toggleIgnore,
    isIgnoredBy,
    saveIgnoredMessage,
    getIgnoredConversationList,
    getIgnoredMessagesFromSender,
    deleteIgnoredMessagesFromSender,
    getMyIgnoreList,
    checkIgnoreStatus,
};