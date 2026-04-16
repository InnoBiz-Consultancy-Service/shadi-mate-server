import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../../utils/catchAsync";
import { sendResponse } from "../../../utils/sendResponse";
import { getProfileByUserIdFromDB, ProfileService } from "./profile.service";

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

    const result = await ProfileService.getProfiles(req.query);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Profiles retrieved successfully",
        data: result
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
export const getProfileById = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const result = await getProfileByUserIdFromDB(userId);

  sendResponse(res, {
    statusCode: 200,
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