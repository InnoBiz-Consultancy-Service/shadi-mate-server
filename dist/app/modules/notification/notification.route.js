"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = require("./notification.controller");
const auth_middleware_1 = __importDefault(require("../../../middleWares/auth.middleware"));
const NotificationRoutes = (0, express_1.Router)();
// GET /api/v1/notifications?page=1&limit=20
NotificationRoutes.get("/", auth_middleware_1.default, notification_controller_1.NotificationController.getMyNotifications);
// GET /api/v1/notifications/unread-count
NotificationRoutes.get("/unread-count", auth_middleware_1.default, notification_controller_1.NotificationController.getUnreadCount);
// PATCH /api/v1/notifications/mark-all-read
NotificationRoutes.patch("/mark-all-read", auth_middleware_1.default, notification_controller_1.NotificationController.markAllAsRead);
// PATCH /api/v1/notifications/:id/read
NotificationRoutes.patch("/:id/read", auth_middleware_1.default, notification_controller_1.NotificationController.markAsRead);
// DELETE /api/v1/notifications/:id
NotificationRoutes.delete("/:id", auth_middleware_1.default, notification_controller_1.NotificationController.deleteNotification);
exports.default = NotificationRoutes;
