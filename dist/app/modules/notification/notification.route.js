"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = require("./notification.controller");
const auth_middleware_1 = require("../../../middleWares/auth.middleware");
const NotificationRoutes = (0, express_1.Router)();
// ─── Get all notifications ────────────────────────────────────────────────────
// GET /api/v1/notifications?page=1&limit=20
NotificationRoutes.get("/", auth_middleware_1.authenticate, notification_controller_1.NotificationController.getMyNotifications);
// ─── Get unread count ─────────────────────────────────────────────────────────
// GET /api/v1/notifications/unread-count
NotificationRoutes.get("/unread-count", auth_middleware_1.authenticate, notification_controller_1.NotificationController.getUnreadCount);
// ─── Mark all as read ─────────────────────────────────────────────────────────
// PATCH /api/v1/notifications/mark-all-read
NotificationRoutes.patch("/mark-all-read", auth_middleware_1.authenticate, notification_controller_1.NotificationController.markAllAsRead);
// ─── Mark single as read ──────────────────────────────────────────────────────
// PATCH /api/v1/notifications/:id/read
NotificationRoutes.patch("/:id/read", auth_middleware_1.authenticate, notification_controller_1.NotificationController.markAsRead);
// ─── Delete notification ──────────────────────────────────────────────────────
// DELETE /api/v1/notifications/:id
NotificationRoutes.delete("/:id", auth_middleware_1.authenticate, notification_controller_1.NotificationController.deleteNotification);
exports.default = NotificationRoutes;
