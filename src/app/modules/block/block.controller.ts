import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../../utils/catchAsync";
import { sendResponse } from "../../../utils/sendResponse";
import { BlockService } from "./block.service";

// ─── Toggle Block / Unblock ───────────────────────────────────────────────────
const toggleBlock = catchAsync(async (req: Request, res: Response) => {
    const blockerId = (req as any).user.id;
    const blockedId = req.params.userId;

    const result = await BlockService.toggleBlock(blockerId, blockedId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.action === "blocked"
            ? "User blocked successfully"
            : "User unblocked successfully",
        data: { action: result.action },
    });
});

// ─── Get Block Status ─────────────────────────────────────────────────────────
const getBlockStatus = catchAsync(async (req: Request, res: Response) => {
    const blockerId = (req as any).user.id;
    const targetId = req.params.userId;

    const result = await BlockService.getBlockStatus(blockerId, targetId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Block status fetched",
        data: result,
    });
});

// ─── Get My Block List ────────────────────────────────────────────────────────
const getMyBlockList = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const result = await BlockService.getMyBlockList(userId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Block list fetched successfully",
        data: result,
    });
});

export const BlockController = {
    toggleBlock,
    getBlockStatus,
    getMyBlockList,
};