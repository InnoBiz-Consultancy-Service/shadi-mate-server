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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = require("../../../utils/catchAsync");
const sendResponse_1 = require("../../../utils/sendResponse");
const notification_service_1 = require("./notification.service");
// ─── Get My Notifications ─────────────────────────────────────────────────────
const getMyNotifications = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = yield notification_service_1.NotificationService.getMyNotifications(userId, page, limit);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Notifications fetched successfully",
        data: result.notifications,
        meta: result.meta,
    });
}));
// ─── Get Unread Count ─────────────────────────────────────────────────────────
const getUnreadCount = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const result = yield notification_service_1.NotificationService.getUnreadCount(userId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Unread count fetched",
        data: result,
    });
}));
// ─── Mark Single as Read ──────────────────────────────────────────────────────
const markAsRead = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { id } = req.params;
    const result = yield notification_service_1.NotificationService.markAsRead(id, userId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Notification marked as read",
        data: result,
    });
}));
// ─── Mark All as Read ─────────────────────────────────────────────────────────
const markAllAsRead = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const result = yield notification_service_1.NotificationService.markAllAsRead(userId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: result.message,
    });
}));
// ─── Delete Notification ──────────────────────────────────────────────────────
const deleteNotification = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { id } = req.params;
    const result = yield notification_service_1.NotificationService.deleteNotification(id, userId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: result.message,
    });
}));
exports.NotificationController = {
    getMyNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
};
