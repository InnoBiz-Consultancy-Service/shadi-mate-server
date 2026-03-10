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

export const ProfileController = {
    createProfile,
    updateProfile
};