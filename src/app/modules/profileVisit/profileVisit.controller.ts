import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../../utils/catchAsync";
import { sendResponse } from "../../../utils/sendResponse";
import { ProfileVisitService } from "./profileVisit.service";

// ─── Get Who Visited My Profile (Premium Only) ───────────────────────────────
const getProfileVisitors = catchAsync(async (req: Request, res: Response) => {
    const profileOwnerId = (req as any).user.id;
    const subscription = (req as any).user.subscription;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await ProfileVisitService.getProfileVisitors(
        profileOwnerId,
        subscription,
        page,
        limit
    );

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Profile visitors fetched successfully",
        data: result.visitors,
        meta: result.meta as any,
    });
});

// ─── Get Visit Count (Free & Premium) ────────────────────────────────────────
const getVisitCount = catchAsync(async (req: Request, res: Response) => {
    const profileOwnerId = (req as any).user.id;
    const result = await ProfileVisitService.getVisitCount(profileOwnerId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Visit count fetched successfully",
        data: result,
    });
});

export const ProfileVisitController = {
    getProfileVisitors,
    getVisitCount,
};