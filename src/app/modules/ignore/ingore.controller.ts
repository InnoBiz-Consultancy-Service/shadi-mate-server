import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../../utils/catchAsync";
import { sendResponse } from "../../../utils/sendResponse";
import { IgnoreService } from "./ignore.service";

// ─── Toggle Ignore / Unignore ─────────────────────────────────────────────────
const toggleIgnore = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const ignoredUserId = req.params.userId;

    const result = await IgnoreService.toggleIgnore(userId, ignoredUserId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.action === "ignored"
            ? "User ignored successfully"
            : "User unignored successfully",
        data: { action: result.action },
    });
});

// ─── Get My Ignore List ───────────────────────────────────────────────────────
const getMyIgnoreList = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const result = await IgnoreService.getMyIgnoreList(userId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Ignore list fetched successfully",
        data: result,
    });
});

// ─── Check Ignore Status ──────────────────────────────────────────────────────
const checkIgnoreStatus = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const targetUserId = req.params.userId;

    const result = await IgnoreService.checkIgnoreStatus(userId, targetUserId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Ignore status fetched",
        data: result,
    });
});

// ─── Get Ignored Conversation List ───────────────────────────────────────────
const getIgnoredConversationList = catchAsync(async (req: Request, res: Response) => {
    const receiverId = (req as any).user.id;
    const result = await IgnoreService.getIgnoredConversationList(receiverId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Ignored conversation list fetched",
        data: result,
    });
});

// ─── Get Ignored Messages from a specific sender ──────────────────────────────
const getIgnoredMessagesFromSender = catchAsync(async (req: Request, res: Response) => {
    const receiverId = (req as any).user.id;
    const senderId = req.params.senderId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await IgnoreService.getIgnoredMessagesFromSender(
        receiverId,
        senderId,
        page,
        limit
    );

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Ignored messages fetched",
        data: result.messages,
        meta: result.meta as any,
    });
});

// ─── Delete Ignored Messages from a sender ────────────────────────────────────
const deleteIgnoredMessagesFromSender = catchAsync(async (req: Request, res: Response) => {
    const receiverId = (req as any).user.id;
    const senderId = req.params.senderId;

    await IgnoreService.deleteIgnoredMessagesFromSender(receiverId, senderId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Ignored messages deleted successfully",
    });
});

export const IgnoreController = {
    toggleIgnore,
    getMyIgnoreList,
    checkIgnoreStatus,
    getIgnoredConversationList,
    getIgnoredMessagesFromSender,
    deleteIgnoredMessagesFromSender,
};