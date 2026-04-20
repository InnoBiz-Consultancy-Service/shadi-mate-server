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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LikeController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = require("../../../utils/catchAsync");
const sendResponse_1 = require("../../../utils/sendResponse");
const like_servce_1 = require("./like.servce");
const toggleLike = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const fromUserId = req.user.id;
    const toUserId = req.params.userId;
    const result = yield like_servce_1.LikeService.toggleLike(fromUserId, toUserId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: result.action === "liked"
            ? "Profile liked successfully"
            : "Profile unliked successfully",
        data: { action: result.action },
    });
}));
const getLikeCount = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const targetUserId = req.params.userId;
    const result = yield like_servce_1.LikeService.getLikeCount(targetUserId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Like count fetched successfully",
        data: result,
    });
}));
const getWhoLikedMe = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const result = yield like_servce_1.LikeService.getWhoLikedMe(userId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Liked by list fetched successfully",
        data: result,
    });
}));
const getMyLikes = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const result = yield like_servce_1.LikeService.getMyLikes(userId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Your liked profiles fetched successfully",
        data: result,
    });
}));
exports.LikeController = {
    toggleLike,
    getLikeCount,
    getWhoLikedMe,
    getMyLikes,
};
