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
exports.IgnoreController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = require("../../../utils/catchAsync");
const sendResponse_1 = require("../../../utils/sendResponse");
const ignore_service_1 = require("./ignore.service");
// ─── Toggle Ignore / Unignore ─────────────────────────────────────────────────
const toggleIgnore = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const ignoredUserId = req.params.userId;
    const result = yield ignore_service_1.IgnoreService.toggleIgnore(userId, ignoredUserId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: result.action === "ignored"
            ? "User ignored successfully"
            : "User unignored successfully",
        data: { action: result.action },
    });
}));
// ─── Get My Ignore List ───────────────────────────────────────────────────────
const getMyIgnoreList = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const result = yield ignore_service_1.IgnoreService.getMyIgnoreList(userId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Ignore list fetched successfully",
        data: result,
    });
}));
// ─── Check Ignore Status ──────────────────────────────────────────────────────
const checkIgnoreStatus = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const targetUserId = req.params.userId;
    const result = yield ignore_service_1.IgnoreService.checkIgnoreStatus(userId, targetUserId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Ignore status fetched",
        data: result,
    });
}));
// ─── Get Ignored Conversation List ───────────────────────────────────────────
const getIgnoredConversationList = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const receiverId = req.user.id;
    const result = yield ignore_service_1.IgnoreService.getIgnoredConversationList(receiverId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Ignored conversation list fetched",
        data: result,
    });
}));
// ─── Get Ignored Messages from a specific sender ──────────────────────────────
const getIgnoredMessagesFromSender = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const receiverId = req.user.id;
    const senderId = req.params.senderId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = yield ignore_service_1.IgnoreService.getIgnoredMessagesFromSender(receiverId, senderId, page, limit);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Ignored messages fetched",
        data: result.messages,
        meta: result.meta,
    });
}));
// ─── Delete Ignored Messages from a sender ────────────────────────────────────
const deleteIgnoredMessagesFromSender = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const receiverId = req.user.id;
    const senderId = req.params.senderId;
    yield ignore_service_1.IgnoreService.deleteIgnoredMessagesFromSender(receiverId, senderId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Ignored messages deleted successfully",
    });
}));
exports.IgnoreController = {
    toggleIgnore,
    getMyIgnoreList,
    checkIgnoreStatus,
    getIgnoredConversationList,
    getIgnoredMessagesFromSender,
    deleteIgnoredMessagesFromSender,
};
