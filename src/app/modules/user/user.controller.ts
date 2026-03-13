import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../../utils/catchAsync";
import { UserService } from "./user.service";
import AppError from "../../../helpers/AppError";
import { sendResponse } from "../../../utils/sendResponse";
import { envVars } from "../../../config/envConfig";

// ─── Register ─────────────────────────────────────────────────────────────────
const register = catchAsync(async (req: Request, res: Response) => {
    const result = await UserService.registerUser(req.body);

    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: result.message,
        data: {
            phone: result.phone,
            otp: result.otp, // 🔴 DEVELOPMENT ONLY — remove in production
        },
    });
});

// ─── Verify OTP ───────────────────────────────────────────────────────────────
const verifyOtp = catchAsync(async (req: Request, res: Response) => {
    const result = await UserService.verifyOtp(req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
        data: result.user,
    });
});

// ─── Login ────────────────────────────────────────────────────────────────────
const login = catchAsync(async (req: Request, res: Response) => {
    const result = await UserService.loginUser(req.body);

    // 🍪 Cookie set
    res.cookie("accessToken", result.token, {
        httpOnly: true,
        secure: envVars.NODE_ENV === "production",
        sameSite: envVars.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
        data: {
            token: result.token,
        },
    });
});
// ─── Forget Password (New Controller) ─────────────────────────────────────────
const resetPassword = catchAsync(async (req: Request, res: Response) => {
    const result = await UserService.resetPassword(req.body);

    if (result.token) {
        res.cookie("accessToken", result.token, {
            httpOnly: true,
            secure: envVars.NODE_ENV === "production",
            sameSite: envVars.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
    }

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
        data: {
            user: result.user,
            token: result.token, // Optional
        },
    });
});

// ─── Get Me (Protected) ───────────────────────────────────────────────────────
const getMe = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const user = await UserService.getMe(userId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Profile fetched successfully",
        data: user,
    });
});

// ─── Resend OTP ───────────────────────────────────────────────────────────────
const resendOtp = catchAsync(async (req: Request, res: Response) => {
    const { phone } = req.body;
    const result = await UserService.resendOtp(phone);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
        data: {
            otp: result.otp, // 🔴 DEVELOPMENT ONLY
        },
    });
});

// ─── Update Profile ───────────────────────────────────────────────────────────
const updateUser = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const result = await UserService.updateUser(userId, req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Profile updated successfully",
        data: result,
    });
});

// ─── Delete User (Soft Delete) ───────────────────────────────────────────────
const deleteUser = catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.id;
    const requestUser = (req as any).user;

    await UserService.deleteUser(userId, requestUser);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "User deleted successfully (soft delete)",
    });
});

// ─── Block / Unblock User ─────────────────────────────────────────────────────
const updateBlockStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isBlocked } = req.body;

    if (typeof isBlocked !== "boolean") {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            "isBlocked must be true or false"
        );
    }

    const requestUser = (req as any).user;
    const result = await UserService.updateBlockStatus(id, isBlocked, requestUser);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: isBlocked
            ? "User blocked successfully"
            : "User unblocked successfully",
        data: result,
    });
});
const verifyResetOtp = catchAsync(async (req: Request, res: Response) => {

    const result = await UserService.verifyResetOtp(req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
    });

});
const forgotPassword = catchAsync(async (req: Request, res: Response) => {
    const { identifier } = req.body;
    const result = await UserService.forgotPassword(identifier);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
        data: {
            otp: result.otp // development only
        }
    });

});

export const UserController = {
    register,
    verifyOtp,
    login,
    resetPassword,
    getMe,
    resendOtp,
    updateUser,
    deleteUser,
    updateBlockStatus,
    forgotPassword,
    verifyResetOtp,
};