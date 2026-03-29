import { Router } from "express";
import { NotificationController } from "./notification.controller";
import { authenticate } from "../../../middleWares/auth.middleware";

const NotificationRoutes = Router();

// ─── Get all notifications ────────────────────────────────────────────────────
// GET /api/v1/notifications?page=1&limit=20
NotificationRoutes.get("/", authenticate, NotificationController.getMyNotifications);

// ─── Get unread count ─────────────────────────────────────────────────────────
// GET /api/v1/notifications/unread-count
NotificationRoutes.get("/unread-count", authenticate, NotificationController.getUnreadCount);

// ─── Mark all as read ─────────────────────────────────────────────────────────
// PATCH /api/v1/notifications/mark-all-read
NotificationRoutes.patch("/mark-all-read", authenticate, NotificationController.markAllAsRead);

// ─── Mark single as read ──────────────────────────────────────────────────────
// PATCH /api/v1/notifications/:id/read
NotificationRoutes.patch("/:id/read", authenticate, NotificationController.markAsRead);

// ─── Delete notification ──────────────────────────────────────────────────────
// DELETE /api/v1/notifications/:id
NotificationRoutes.delete("/:id", authenticate, NotificationController.deleteNotification);

export default NotificationRoutes;