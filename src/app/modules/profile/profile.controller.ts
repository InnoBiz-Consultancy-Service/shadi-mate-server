import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../../utils/catchAsync";
import { sendResponse } from "../../../utils/sendResponse";
import { ProfileService } from "./profile.service";

const createProfile = catchAsync(async (req: Request, res: Response) => {
    const result = await ProfileService.createProfile(req.body);

    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: "Profile created successfully",
        data: result,
    });
});

export const ProfileController = {
    createProfile,
};