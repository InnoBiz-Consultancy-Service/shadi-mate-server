import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../../utils/catchAsync";
import { sendResponse } from "../../../utils/sendResponse";
import { LikeService } from "./like.servce";

const toggleLike = catchAsync(async (req: Request, res: Response) => {
    const fromUserId = (req as any).user.id;
    const toUserId = req.params.userId;

    const result = await LikeService.toggleLike(fromUserId, toUserId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.action === "liked"
            ? "Profile liked successfully"
            : "Profile unliked successfully",
        data: { action: result.action },
    });
});

const getLikeCount = catchAsync(async (req: Request, res: Response) => {
    const targetUserId = req.params.userId;

    const result = await LikeService.getLikeCount(targetUserId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Like count fetched successfully",
        data: result,
    });
});

const getWhoLikedMe = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;

    const result = await LikeService.getWhoLikedMe(userId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Liked by list fetched successfully",
        data: result,
    });
});

const getMyLikes = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;

    const result = await LikeService.getMyLikes(userId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Your liked profiles fetched successfully",
        data: result,
    });
});

export const LikeController = {
    toggleLike,
    getLikeCount,
    getWhoLikedMe,
    getMyLikes,
};