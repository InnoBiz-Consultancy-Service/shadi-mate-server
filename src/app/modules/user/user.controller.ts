import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../../utils/catchAsync";
import { UserService } from "./user.service";
import AppError from "../../../helpers/AppError";
import { sendResponse } from "../../../utils/sendResponse";

// ─── Helper: safe userId getter ──────────────────────────────────────────────
const getUserId = (req: Request): string => {
    const user = (req as any).user;

    const userId = user?._id || user?.id;

    if (!userId) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "User not authenticated");
    }

    return userId;
};

// ─── Register ─────────────────────────────────────────────────────────────────
const register = catchAsync(async (req: Request, res: Response) => {
    const result = await UserService.registerUser(req.body);

    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: result.message,
        data: {
            phone: result.phone,
            otp: result.otp,
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
        data: {
            accessToken: result.accessToken,
        },
    });
});

// ─── Login ────────────────────────────────────────────────────────────────────
const login = catchAsync(async (req: Request, res: Response) => {
    const result = await UserService.loginUser(req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
        data: {
            accessToken: result.accessToken,
            user: result.user,
        },
    });
});

// ─── Refresh Access Token ─────────────────────────────────────────────────────
const refreshToken = catchAsync(async (req: Request, res: Response) => {
    const { userId, refreshToken: incomingRefreshToken } = req.body;

    if (!userId || !incomingRefreshToken) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            "userId and refreshToken are required"
        );
    }

    const result = await UserService.refreshAccessToken(userId, incomingRefreshToken);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
        data: {
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
        },
    });
});

// ─── Logout ───────────────────────────────────────────────────────────────────
const logout = catchAsync(async (req: Request, res: Response) => {
    const accessToken = req.headers.authorization?.split(" ")[1] || "";
    const userId = getUserId(req);

    await UserService.logoutUser(accessToken, userId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Logged out successfully",
    });
});

// ─── Reset Password ───────────────────────────────────────────────────────────
const resetPassword = catchAsync(async (req: Request, res: Response) => {
    const result = await UserService.resetPassword(req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
        data: {
            accessToken: result.accessToken,
        },
    });
});

// ─── Forgot Password ─────────────────────────────────────────────────────────
const forgotPassword = catchAsync(async (req: Request, res: Response) => {
    const { identifier } = req.body;
    const result = await UserService.forgotPassword(identifier);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
        data: {
            otp: result.otp,
        },
    });
});

// ─── Verify Reset OTP ─────────────────────────────────────────────────────────
const verifyResetOtp = catchAsync(async (req: Request, res: Response) => {
    const result = await UserService.verifyResetOtp(req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
    });
});

// ─── Get Me ───────────────────────────────────────────────────────────────────
const getMe = catchAsync(async (req: Request, res: Response) => {
    const userId = getUserId(req);
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
            otp: result.otp,
        },
    });
});

// ─── Update Profile ───────────────────────────────────────────────────────────
const updateUser = catchAsync(async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const result = await UserService.updateUser(userId, req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Profile updated successfully",
        data: result,
    });
});

// ─── Delete User ─────────────────────────────────────────────────────────────
const deleteUser = catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.id;
    const requestUser = (req as any).user;

    await UserService.deleteUser(userId, requestUser);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "User deleted successfully",
    });
});

// ─── Block / Unblock ─────────────────────────────────────────────────────────
const updateBlockStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isBlocked } = req.body;

    if (typeof isBlocked !== "boolean") {
        throw new AppError(StatusCodes.BAD_REQUEST, "isBlocked must be true or false");
    }

    const result = await UserService.updateBlockStatus(id, isBlocked, (req as any).user);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: isBlocked ? "User blocked successfully" : "User unblocked successfully",
        data: result,
    });
});

export const UserController = {
    register,
    verifyOtp,
    login,
    refreshToken,
    logout,
    resetPassword,
    forgotPassword,
    verifyResetOtp,
    getMe,
    resendOtp,
    updateUser,
    deleteUser,
    updateBlockStatus,
};