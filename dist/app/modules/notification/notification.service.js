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
exports.NotificationService = exports.invalidateUnreadCache = void 0;
// src/app/modules/notification/notification.service.ts — OPTIMIZED
// EXTRA CHANGE: unreadCount Redis cache যোগ করা হয়েছে
// প্রতিটা page load এ unreadCount DB query হয় — এখন cache করা হবে
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../../helpers/AppError"));
const notification_model_1 = require("./notification.model");
const redis_1 = __importDefault(require("../../../utils/redis"));
const UNREAD_CACHE_KEY = (userId) => `notif:unread:${userId}`;
const UNREAD_CACHE_TTL = 30; // 30 seconds — notification আসলে invalidate হবে
// unread cache invalidate করার helper
const invalidateUnreadCache = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield redis_1.default.del(UNREAD_CACHE_KEY(userId));
    }
    catch (_) { }
});
exports.invalidateUnreadCache = invalidateUnreadCache;
const getNotificationMessage = (type, senderName, metadata) => {
    var _a;
    switch (type) {
        case "new_message":
            return `${senderName} sent you a new message`;
        case "like":
            return `${senderName} liked your profile`;
        case "profile_visit":
            return `${senderName} visited your profile`;
        case "subscription_expiry_reminder":
            return (metadata === null || metadata === void 0 ? void 0 : metadata.daysLeft) === 1
                ? `Your Premium subscription expires tomorrow. Renew now.`
                : `Your Premium subscription has ${(_a = metadata === null || metadata === void 0 ? void 0 : metadata.daysLeft) !== null && _a !== void 0 ? _a : ""} days left.`;
        default:
            return "You have a new notification";
    }
};
const createAndDeliver = (_a) => __awaiter(void 0, [_a], void 0, function* ({ io, redisClient: rc, recipientId, senderId, senderName, type, metadata = {}, customMessage, }) {
    const message = customMessage !== null && customMessage !== void 0 ? customMessage : getNotificationMessage(type, senderName, metadata);
    const notification = yield notification_model_1.Notification.create({
        recipientId, senderId, type, message, isRead: false, metadata,
    });
    // unread cache invalidate — নতুন notification আসলে count বদলায়
    yield (0, exports.invalidateUnreadCache)(recipientId);
    const receiverSocketId = yield rc.hGet("onlineUsers", recipientId);
    if (receiverSocketId) {
        io.to(String(receiverSocketId)).emit("new-notification", {
            _id: notification._id,
            type, message, senderId, senderName, metadata,
            isRead: false,
            createdAt: notification.createdAt,
        });
    }
    return notification;
});
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
        meta: { total, unreadCount, page, limit, totalPages: Math.ceil(total / limit) },
    };
});
const markAsRead = (notificationId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const notification = yield notification_model_1.Notification.findOneAndUpdate({ _id: notificationId, recipientId: userId }, { isRead: true }, { new: true });
    if (!notification)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Notification not found");
    yield (0, exports.invalidateUnreadCache)(userId);
    return notification;
});
const markAllAsRead = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    yield notification_model_1.Notification.updateMany({ recipientId: userId, isRead: false }, { isRead: true });
    yield (0, exports.invalidateUnreadCache)(userId);
    return { message: "All notifications marked as read" };
});
const deleteNotification = (notificationId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const notification = yield notification_model_1.Notification.findOneAndDelete({
        _id: notificationId, recipientId: userId,
    });
    if (!notification)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Notification not found");
    yield (0, exports.invalidateUnreadCache)(userId);
    return { message: "Notification deleted" };
});
// EXTRA CHANGE: getUnreadCount এ Redis cache
// প্রতিটা page load এ এই endpoint hit হয় — cache করলে DB load অনেক কমবে
const getUnreadCount = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Cache check
    try {
        const cached = yield redis_1.default.get(UNREAD_CACHE_KEY(userId));
        if (cached !== null)
            return { unreadCount: parseInt(cached) };
    }
    catch (_) { }
    const count = yield notification_model_1.Notification.countDocuments({
        recipientId: userId, isRead: false,
    });
    // Cache store
    try {
        yield redis_1.default.setEx(UNREAD_CACHE_KEY(userId), UNREAD_CACHE_TTL, count.toString());
    }
    catch (_) { }
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
