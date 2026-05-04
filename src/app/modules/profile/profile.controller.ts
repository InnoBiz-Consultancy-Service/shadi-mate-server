import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../../utils/catchAsync";
import { sendResponse } from "../../../utils/sendResponse";
import { ProfileService } from "./profile.service";

const createProfile = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await ProfileService.createProfile(userId, req.body);

    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: "Profile created successfully",
        data: result
    });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await ProfileService.updateProfile(userId, req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Profile updated successfully",
        data: result
    });
});

// ─── Get Profiles (Search + Filter) ─────────────────
const getProfiles = catchAsync(async (req: Request, res: Response) => {
    console.log("👉 req.user:", req.user);
    console.log("👉 gender:", req.user?.gender);
    
    const result = await ProfileService.getProfiles(
        req.query as any,
        req.user?.id!,
        req.user?.gender || "",
    );
    
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Profiles fetched successfully",
        data: result,
    });
});

// ─── Get My Profile ─────────────────────────
const getMyProfile = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const profile = await ProfileService.getMyProfile(userId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "My profile retrieved successfully",
        data: profile
    });
});

// ─── Get Profile by ID ─────────────────────────
const getProfileById = catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.params;
    
    // ✅ ProfileService এর method ব্যবহার করুন
    const result = await ProfileService.getProfileByUserIdFromDB(userId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Profile retrieved successfully",
        data: result,
    });
});

export const ProfileController = {
    createProfile,
    updateProfile,
    getProfiles,
    getMyProfile,
    getProfileById
};