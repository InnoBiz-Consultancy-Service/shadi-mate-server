import { StatusCodes } from "http-status-codes";
import AppError from "../../../helpers/AppError";
import { Notification } from "./notification.model";
import { TNotificationType, INotificationMetadata } from "./notification.interface";

// ─── Message Templates ────────────────────────────────────────────────────────
const getNotificationMessage = (
    type: TNotificationType,
    senderName: string,
    metadata?: INotificationMetadata
): string => {
    switch (type) {
        case "new_message":
            return `${senderName} Send you a new message`;
        case "like":
            return `${senderName} liked your profile`;
        case "profile_visit":
            return `${senderName} visited your profile`;
        case "subscription_expiry_reminder":
            // Cron job থেকে directly message পাঠানো হয় — এখানে fallback
            return metadata?.daysLeft === 1
                ? `Your Premium subscription expires tomorrow (${metadata?.endDate ? new Date(metadata.endDate).toLocaleDateString("en-US") : ""}). Renew now.`
                : `Your Premium subscription ${metadata?.daysLeft ?? ""} days left.`;
        default:
            return "You have a new notification";
    }
};


const createAndDeliver = async ({
    io,
    redisClient,
    recipientId,
    senderId,
    senderName,
    type,
    metadata = {},
    customMessage,
}: {
    io: any;
    redisClient: any;
    recipientId: string;
    senderId: string;
    senderName: string;
    type: TNotificationType;
    metadata?: INotificationMetadata;
    customMessage?: string; // subscription reminder এ custom message পাঠাতে
}) => {
    const message = customMessage ?? getNotificationMessage(type, senderName, metadata);

    // ─── DB তে save করো (offline support) ────────────────────────────────────
    const notification = await Notification.create({
        recipientId,
        senderId,
        type,
        message,
        isRead: false,
        metadata,
    });

    // ─── Receiver online আছে কিনা check করো ─────────────────────────────────
const receiverSocketId = await redisClient.hGet("onlineUsers", recipientId);
    if (receiverSocketId) {
        io.to(receiverSocketId).emit("new-notification", {
            _id:       notification._id,
            type,
            message,
            senderId,
            senderName,
            metadata,
            isRead:    false,
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

// ─── Mark Single as Read ──────────────────────────────────────────────────────
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

// ─── Get Unread Count ─────────────────────────────────────────────────────────
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