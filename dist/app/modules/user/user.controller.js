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
// ─── Helper: safe userId getter ──────────────────────────────────────────────
const getUserId = (req) => {
    const user = req.user;
    const userId = (user === null || user === void 0 ? void 0 : user._id) || (user === null || user === void 0 ? void 0 : user.id);
    if (!userId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "User not authenticated");
    }
    return userId;
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
            otp: result.otp,
        },
    });
}));
// ─── Verify OTP ───────────────────────────────────────────────────────────────
const verifyOtp = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield user_service_1.UserService.verifyOtp(req.body);
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
// ─── Login ────────────────────────────────────────────────────────────────────
const login = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield user_service_1.UserService.loginUser(req.body);
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
// ─── Refresh Access Token ─────────────────────────────────────────────────────
const refreshToken = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, refreshToken: incomingRefreshToken } = req.body;
    if (!userId || !incomingRefreshToken) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "userId and refreshToken are required");
    }
    const result = yield user_service_1.UserService.refreshAccessToken(userId, incomingRefreshToken);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: result.message,
        data: {
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
        },
    });
}));
// ─── Logout ───────────────────────────────────────────────────────────────────
const logout = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const accessToken = ((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1]) || "";
    const userId = getUserId(req);
    yield user_service_1.UserService.logoutUser(accessToken, userId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Logged out successfully",
    });
}));
// ─── Reset Password ───────────────────────────────────────────────────────────
const resetPassword = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield user_service_1.UserService.resetPassword(req.body);
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
            otp: result.otp,
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
// ─── Get Me ───────────────────────────────────────────────────────────────────
const getMe = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = getUserId(req);
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
            otp: result.otp,
        },
    });
}));
// ─── Update Profile ───────────────────────────────────────────────────────────
const updateUser = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = getUserId(req);
    const result = yield user_service_1.UserService.updateUser(userId, req.body);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Profile updated successfully",
        data: result,
    });
}));
// ─── Delete User ─────────────────────────────────────────────────────────────
const deleteUser = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.id;
    const requestUser = req.user;
    yield user_service_1.UserService.deleteUser(userId, requestUser);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "User deleted successfully",
    });
}));
// ─── Block / Unblock ─────────────────────────────────────────────────────────
const updateBlockStatus = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { isBlocked } = req.body;
    if (typeof isBlocked !== "boolean") {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "isBlocked must be true or false");
    }
    const result = yield user_service_1.UserService.updateBlockStatus(id, isBlocked, req.user);
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
