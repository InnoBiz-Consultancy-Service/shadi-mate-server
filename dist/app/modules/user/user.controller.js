"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = require("../../../utils/catchAsync");
const user_service_1 = require("./user.service");
const AppError_1 = __importDefault(require("../../../helpers/AppError"));
const sendResponse_1 = require("../../../utils/sendResponse");
const envConfig_1 = require("../../../config/envConfig");
// ─── Cookie Helper ────────────────────────────────────────────────────────────
const isProduction = envConfig_1.envVars.NODE_ENV === "production";
const setAuthCookies = (res, accessToken, refreshToken) => {
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
const clearAuthCookies = (res) => {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
};
// ─── Register ─────────────────────────────────────────────────────────────────
const register = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield user_service_1.UserService.registerUser(req.body);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: result.message,
        data: {
            phone: result.phone,
            otp: result.otp, // 🔴 DEVELOPMENT ONLY — remove in production
        },
    });
}));
// ─── Verify OTP ───────────────────────────────────────────────────────────────
const verifyOtp = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield user_service_1.UserService.verifyOtp(req.body);
    // ✅ Cookie set after successful OTP verification (auto-login)
    setAuthCookies(res, result.accessToken, result.refreshToken);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: result.message,
        data: {
            accessToken: result.accessToken, // client may also keep in memory
            user: result.user,
        },
    });
}));
// ─── Login ────────────────────────────────────────────────────────────────────
const login = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield user_service_1.UserService.loginUser(req.body);
    // ✅ Both tokens set in HttpOnly cookies
    setAuthCookies(res, result.accessToken, result.refreshToken);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: result.message,
        data: {
            accessToken: result.accessToken, // client may also keep in memory
            user: result.user,
        },
    });
}));
// ─── Refresh Access Token ─────────────────────────────────────────────────────
// Client calls this automatically when it receives 401
const refreshToken = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    // HttpOnly cookie থেকে নেবে (web), body থেকে নেবে (mobile)
    const incomingRefreshToken = ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.refreshToken) || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.refreshToken);
    const userId = (_c = req.body) === null || _c === void 0 ? void 0 : _c.userId;
    if (!incomingRefreshToken || !userId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "userId and refreshToken are required");
    }
    const result = yield user_service_1.UserService.refreshAccessToken(userId, incomingRefreshToken);
    // ✅ Rotate both cookies — old refresh token invalid হয়ে যাবে
    setAuthCookies(res, result.accessToken, result.refreshToken);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: result.message,
        data: {
            accessToken: result.accessToken,
        },
    });
}));
// ─── Reset Password ───────────────────────────────────────────────────────────
const resetPassword = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield user_service_1.UserService.resetPassword(req.body);
    // ✅ New tokens issued — old sessions invalidated
    setAuthCookies(res, result.accessToken, result.refreshToken);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: result.message,
        data: {
            accessToken: result.accessToken,
            user: result.user,
        },
    });
}));
// ─── Forgot Password ─────────────────────────────────────────────────────────
const forgotPassword = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { identifier } = req.body;
    const result = yield user_service_1.UserService.forgotPassword(identifier);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: result.message,
        data: {
            otp: result.otp, // 🔴 DEVELOPMENT ONLY
        },
    });
}));
// ─── Verify Reset OTP ─────────────────────────────────────────────────────────
const verifyResetOtp = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield user_service_1.UserService.verifyResetOtp(req.body);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: result.message,
    });
}));
// ─── Get Me (Protected) ───────────────────────────────────────────────────────
const getMe = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const user = yield user_service_1.UserService.getMe(userId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Profile fetched successfully",
        data: user,
    });
}));
// ─── Resend OTP ───────────────────────────────────────────────────────────────
const resendOtp = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { phone } = req.body;
    const result = yield user_service_1.UserService.resendOtp(phone);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: result.message,
        data: {
            otp: result.otp, // 🔴 DEVELOPMENT ONLY
        },
    });
}));
// ─── Update Profile ───────────────────────────────────────────────────────────
const updateUser = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const result = yield user_service_1.UserService.updateUser(userId, req.body);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Profile updated successfully",
        data: result,
    });
}));
// ─── Delete User (Soft Delete) ───────────────────────────────────────────────
const deleteUser = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.id;
    const requestUser = req.user;
    yield user_service_1.UserService.deleteUser(userId, requestUser);
    // ✅ নিজের account delete করলে cookies ও clear
    if (String(requestUser._id) === userId) {
        clearAuthCookies(res);
    }
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "User deleted successfully",
    });
}));
// ─── Block / Unblock User ─────────────────────────────────────────────────────
const updateBlockStatus = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { isBlocked } = req.body;
    if (typeof isBlocked !== "boolean") {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "isBlocked must be true or false");
    }
    const requestUser = req.user;
    const result = yield user_service_1.UserService.updateBlockStatus(id, isBlocked, requestUser);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: isBlocked ? "User blocked successfully" : "User unblocked successfully",
        data: result,
    });
}));
exports.UserController = {
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
