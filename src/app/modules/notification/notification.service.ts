// src/app/modules/notification/notification.service.ts — OPTIMIZED
// EXTRA CHANGE: unreadCount Redis cache যোগ করা হয়েছে
// প্রতিটা page load এ unreadCount DB query হয় — এখন cache করা হবে
import { StatusCodes }       from "http-status-codes";
import AppError              from "../../../helpers/AppError";
import { Notification }      from "./notification.model";
import { TNotificationType, INotificationMetadata } from "./notification.interface";
import redisClient           from "../../../utils/redis";

const UNREAD_CACHE_KEY = (userId: string) => `notif:unread:${userId}`;
const UNREAD_CACHE_TTL = 30; // 30 seconds — notification আসলে invalidate হবে

// unread cache invalidate করার helper
export const invalidateUnreadCache = async (userId: string) => {
  try { await redisClient.del(UNREAD_CACHE_KEY(userId)); } catch (_) {}
};

const getNotificationMessage = (
  type:       TNotificationType,
  senderName: string,
  metadata?:  INotificationMetadata
): string => {
  switch (type) {
    case "new_message":
      return `${senderName} sent you a new message`;
    case "like":
      return `${senderName} liked your profile`;
    case "profile_visit":
      return `${senderName} visited your profile`;
    case "subscription_expiry_reminder":
      return metadata?.daysLeft === 1
        ? `Your Premium subscription expires tomorrow. Renew now.`
        : `Your Premium subscription has ${metadata?.daysLeft ?? ""} days left.`;
    default:
      return "You have a new notification";
  }
};

const createAndDeliver = async ({
  io, redisClient: rc,
  recipientId, senderId, senderName,
  type, metadata = {}, customMessage,
}: {
  io: any; redisClient: any;
  recipientId: string; senderId: string; senderName: string;
  type: TNotificationType; metadata?: INotificationMetadata;
  customMessage?: string;
}) => {
  const message = customMessage ?? getNotificationMessage(type, senderName, metadata);

  const notification = await Notification.create({
    recipientId, senderId, type, message, isRead: false, metadata,
  });

  // unread cache invalidate — নতুন notification আসলে count বদলায়
  await invalidateUnreadCache(recipientId);

  const receiverSocketId = await rc.hGet("onlineUsers", recipientId);
  if (receiverSocketId) {
    io.to(String(receiverSocketId)).emit("new-notification", {
      _id:       notification._id,
      type, message, senderId, senderName, metadata,
      isRead:    false,
      createdAt: notification.createdAt,
    });
  }

  return notification;
};

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
    meta: { total, unreadCount, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

const markAsRead = async (notificationId: string, userId: string) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipientId: userId },
    { isRead: true },
    { new: true }
  );
  if (!notification) throw new AppError(StatusCodes.NOT_FOUND, "Notification not found");

  await invalidateUnreadCache(userId);
  return notification;
};

const markAllAsRead = async (userId: string) => {
  await Notification.updateMany(
    { recipientId: userId, isRead: false },
    { isRead: true }
  );
  await invalidateUnreadCache(userId);
  return { message: "All notifications marked as read" };
};

const deleteNotification = async (notificationId: string, userId: string) => {
  const notification = await Notification.findOneAndDelete({
    _id: notificationId, recipientId: userId,
  });
  if (!notification) throw new AppError(StatusCodes.NOT_FOUND, "Notification not found");

  await invalidateUnreadCache(userId);
  return { message: "Notification deleted" };
};

// EXTRA CHANGE: getUnreadCount এ Redis cache
// প্রতিটা page load এ এই endpoint hit হয় — cache করলে DB load অনেক কমবে
const getUnreadCount = async (userId: string) => {
  // Cache check
  try {
    const cached = await redisClient.get(UNREAD_CACHE_KEY(userId));
    if (cached !== null) return { unreadCount: parseInt(cached) };
  } catch (_) {}

  const count = await Notification.countDocuments({
    recipientId: userId, isRead: false,
  });

  // Cache store
  try {
    await redisClient.setEx(UNREAD_CACHE_KEY(userId), UNREAD_CACHE_TTL, count.toString());
  } catch (_) {}

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
