import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../../utils/catchAsync";
import { UserService } from "./user.service";
import AppError from "../../../helpers/AppError";
import { sendResponse } from "../../../utils/sendResponse";
import { envVars } from "../../../config/envConfig";

// ─── Cookie Helper ────────────────────────────────────────────────────────────
const isProduction = envVars.NODE_ENV === "production";

const setAuthCookies = (
    res: Response,
    accessToken: string,
    refreshToken: string | null
) => {
    // Access token — 15 min
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days
    });

    // Refresh token — 7 days
    if (refreshToken) {
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });
    }
};

const clearAuthCookies = (res: Response) => {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
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
            otp: result.otp, // 🔴 DEVELOPMENT ONLY — remove in production
        },
    });
});

// ─── Verify OTP ───────────────────────────────────────────────────────────────
const verifyOtp = catchAsync(async (req: Request, res: Response) => {
    const result = await UserService.verifyOtp(req.body);

    // ✅ Cookie set after successful OTP verification (auto-login)
    setAuthCookies(res, result.accessToken, result.refreshToken);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
        data: {
            accessToken: result.accessToken, // client may also keep in memory
            user: result.user,
        },
    });
});

// ─── Login ────────────────────────────────────────────────────────────────────
const login = catchAsync(async (req: Request, res: Response) => {
    const result = await UserService.loginUser(req.body);

    // ✅ Both tokens set in HttpOnly cookies
    setAuthCookies(res, result.accessToken, result.refreshToken);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
        data: {
            accessToken: result.accessToken, // client may also keep in memory
            user: result.user,
        },
    });
});

// ─── Refresh Access Token ─────────────────────────────────────────────────────
// Client calls this automatically when it receives 401
const refreshToken = catchAsync(async (req: Request, res: Response) => {
    // HttpOnly cookie থেকে নেবে (web), body থেকে নেবে (mobile)
    const incomingRefreshToken =
        req.cookies?.refreshToken || req.body?.refreshToken;

    const userId = req.body?.userId;

    if (!incomingRefreshToken || !userId) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            "userId and refreshToken are required"
        );
    }

    const result = await UserService.refreshAccessToken(userId, incomingRefreshToken);

    // ✅ Rotate both cookies — old refresh token invalid হয়ে যাবে
    setAuthCookies(res, result.accessToken, result.refreshToken);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
        data: {
            accessToken: result.accessToken,
        },
    });
});


// ─── Reset Password ───────────────────────────────────────────────────────────
const resetPassword = catchAsync(async (req: Request, res: Response) => {
    const result = await UserService.resetPassword(req.body);

    // ✅ New tokens issued — old sessions invalidated
    setAuthCookies(res, result.accessToken, result.refreshToken);

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

// ─── Forgot Password ─────────────────────────────────────────────────────────
const forgotPassword = catchAsync(async (req: Request, res: Response) => {
    const { identifier } = req.body;
    const result = await UserService.forgotPassword(identifier);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result.message,
        data: {
            otp: result.otp, // 🔴 DEVELOPMENT ONLY
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

// ─── Get Me (Protected) ───────────────────────────────────────────────────────
const getMe = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user._id;
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
    const userId = (req as any).user._id;
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

    // ✅ নিজের account delete করলে cookies ও clear
    if (String(requestUser._id) === userId) {
        clearAuthCookies(res);
    }

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "User deleted successfully",
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
        message: isBlocked ? "User blocked successfully" : "User unblocked successfully",
        data: result,
    });
});

export const UserController = {
    register,
    verifyOtp,
    login,
    refreshToken,
    resetPassword,
    forgotPassword,
    verifyResetOtp,
    getMe,
    resendOtp,
    updateUser,
    deleteUser,
    updateBlockStatus,
};