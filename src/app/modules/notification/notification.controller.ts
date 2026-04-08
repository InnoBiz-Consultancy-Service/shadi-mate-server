import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../../utils/catchAsync";
import { sendResponse } from "../../../utils/sendResponse";
import { NotificationService } from "./notification.service";

// ─── Get My Notifications ─────────────────────────────────────────────────────
const getMyNotifications = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const page  = parseInt(req.query.page  as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await NotificationService.getMyNotifications(userId, page, limit);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Notifications fetched successfully",
        data: result.notifications,
        meta: result.meta as any,
    });
});

// ─── Get Unread Count ─────────────────────────────────────────────────────────
const getUnreadCount = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const result = await NotificationService.getUnreadCount(userId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Unread count fetched",
        data: result,
    });
});

// ─── Mark Single as Read ──────────────────────────────────────────────────────
const markAsRead = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const { id }  = req.params;

    const result = await NotificationService.markAsRead(id, userId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Notification marked as read",
        data: result,
    });
});

// ─── Mark All as Read ─────────────────────────────────────────────────────────
const markAllAsRead = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const result = await NotificationService.markAllAsRead(userId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
    });
});

// ─── Delete Notification ──────────────────────────────────────────────────────
const deleteNotification = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const { id }  = req.params;

    const result = await NotificationService.deleteNotification(id, userId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
    });
});

export const NotificationController = {
    getMyNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
};