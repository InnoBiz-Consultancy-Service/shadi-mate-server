import { StatusCodes } from "http-status-codes";
import AppError from "../../../helpers/AppError";
import { Notification } from "./notification.model";
import { TNotificationType } from "./notification.interface";

// ─── Create & Deliver Notification ───────────────────────────────────────────
const createAndDeliver = async ({
    io,
    redisClient,
    recipientId,
    senderId,
    senderName,
    type,
    metadata = {},
}: {
    io: any;
    redisClient: any;
    recipientId: string;
    senderId: string;
    senderName: string;
    type: TNotificationType;
    metadata?: { messageId?: string; conversationWith?: string };
}) => {
    // ─── Notification message তৈরি করো ───────────────────────────────────────
    const messageMap: Record<TNotificationType, string> = {
        new_message: `${senderName} তোমাকে একটি message করেছে`,
        like: `${senderName} তোমার profile like করেছে`,
        profile_visit: `${senderName} তোমার profile দেখেছে`,
    };

    // ─── DB-তে save করো (offline support) ────────────────────────────────────
    const notification = await Notification.create({
        recipientId,
        senderId,
        type,
        message: messageMap[type],
        isRead: false,
        metadata,
    });

    // ─── Receiver online আছে কিনা check করো ─────────────────────────────────
    const receiverSocketId = await redisClient.hget("onlineUsers", recipientId);

    if (receiverSocketId) {
        // ─── Realtime push ────────────────────────────────────────────────────
        io.to(receiverSocketId).emit("new-notification", {
            _id: notification._id,
            type,
            message: messageMap[type],
            senderId,
            senderName,
            metadata,
            isRead: false,
            createdAt: notification.createdAt,
        });
    }

    return notification;
};

// ─── Get My Notifications ─────────────────────────────────────────────────────
const getMyNotifications = async (userId: string, page = 1, limit = 20) => {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
        Notification.find({ recipientId: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("senderId", "name")
            .lean(),
        Notification.countDocuments({ recipientId: userId }),
        Notification.countDocuments({ recipientId: userId, isRead: false }),
    ]);

    return {
        notifications,
        meta: {
            total,
            unreadCount,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};

// ─── Mark Single Notification as Read ────────────────────────────────────────
const markAsRead = async (notificationId: string, userId: string) => {
    const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, recipientId: userId },
        { isRead: true },
        { new: true }
    );

    if (!notification) {
        throw new AppError(StatusCodes.NOT_FOUND, "Notification not found");
    }

    return notification;
};

// ─── Mark All as Read ────────────────────────────────────────────────────────
const markAllAsRead = async (userId: string) => {
    await Notification.updateMany(
        { recipientId: userId, isRead: false },
        { isRead: true }
    );

    return { message: "All notifications marked as read" };
};

// ─── Delete a Notification ────────────────────────────────────────────────────
const deleteNotification = async (notificationId: string, userId: string) => {
    const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        recipientId: userId,
    });

    if (!notification) {
        throw new AppError(StatusCodes.NOT_FOUND, "Notification not found");
    }

    return { message: "Notification deleted" };
};

// ─── Get Unread Count only ────────────────────────────────────────────────────
const getUnreadCount = async (userId: string) => {
    const count = await Notification.countDocuments({
        recipientId: userId,
        isRead: false,
    });

    return { unreadCount: count };
};

export const NotificationService = {
    createAndDeliver,
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCount,
};