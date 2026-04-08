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
exports.NotificationService = void 0;
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../../helpers/AppError"));
const notification_model_1 = require("./notification.model");
// ─── Message Templates ────────────────────────────────────────────────────────
const getNotificationMessage = (type, senderName, metadata) => {
    var _a;
    switch (type) {
        case "new_message":
            return `${senderName} Send you a new message`;
        case "like":
            return `${senderName} liked your profile`;
        case "profile_visit":
            return `${senderName} visited your profile`;
        case "subscription_expiry_reminder":
            // Cron job থেকে directly message পাঠানো হয় — এখানে fallback
            return (metadata === null || metadata === void 0 ? void 0 : metadata.daysLeft) === 1
                ? `Your Premium subscription expires tomorrow (${(metadata === null || metadata === void 0 ? void 0 : metadata.endDate) ? new Date(metadata.endDate).toLocaleDateString("en-US") : ""}). Renew now.`
                : `Your Premium subscription ${(_a = metadata === null || metadata === void 0 ? void 0 : metadata.daysLeft) !== null && _a !== void 0 ? _a : ""} days left.`;
        default:
            return "You have a new notification";
    }
};
// ─── Create & Deliver Notification ───────────────────────────────────────────
// io এবং redisClient বাইরে থেকে পাস — circular import এড়াতে
const createAndDeliver = (_a) => __awaiter(void 0, [_a], void 0, function* ({ io, redisClient, recipientId, senderId, senderName, type, metadata = {}, customMessage, }) {
    const message = customMessage !== null && customMessage !== void 0 ? customMessage : getNotificationMessage(type, senderName, metadata);
    // ─── DB তে save করো (offline support) ────────────────────────────────────
    const notification = yield notification_model_1.Notification.create({
        recipientId,
        senderId,
        type,
        message,
        isRead: false,
        metadata,
    });
    // ─── Receiver online আছে কিনা check করো ─────────────────────────────────
    const receiverSocketId = yield redisClient.hget("onlineUsers", recipientId);
    if (receiverSocketId) {
        io.to(receiverSocketId).emit("new-notification", {
            _id: notification._id,
            type,
            message,
            senderId,
            senderName,
            metadata,
            isRead: false,
            createdAt: notification.createdAt,
        });
    }
    return notification;
});
// ─── Get My Notifications ─────────────────────────────────────────────────────
const getMyNotifications = (userId_1, ...args_1) => __awaiter(void 0, [userId_1, ...args_1], void 0, function* (userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notifications, total, unreadCount] = yield Promise.all([
        notification_model_1.Notification.find({ recipientId: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("senderId", "name")
            .lean(),
        notification_model_1.Notification.countDocuments({ recipientId: userId }),
        notification_model_1.Notification.countDocuments({ recipientId: userId, isRead: false }),
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
});
// ─── Mark Single as Read ──────────────────────────────────────────────────────
const markAsRead = (notificationId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const notification = yield notification_model_1.Notification.findOneAndUpdate({ _id: notificationId, recipientId: userId }, { isRead: true }, { new: true });
    if (!notification) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Notification not found");
    }
    return notification;
});
// ─── Mark All as Read ────────────────────────────────────────────────────────
const markAllAsRead = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    yield notification_model_1.Notification.updateMany({ recipientId: userId, isRead: false }, { isRead: true });
    return { message: "All notifications marked as read" };
});
// ─── Delete a Notification ────────────────────────────────────────────────────
const deleteNotification = (notificationId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const notification = yield notification_model_1.Notification.findOneAndDelete({
        _id: notificationId,
        recipientId: userId,
    });
    if (!notification) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Notification not found");
    }
    return { message: "Notification deleted" };
});
// ─── Get Unread Count ─────────────────────────────────────────────────────────
const getUnreadCount = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const count = yield notification_model_1.Notification.countDocuments({
        recipientId: userId,
        isRead: false,
    });
    return { unreadCount: count };
});
exports.NotificationService = {
    createAndDeliver,
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCount,
};
