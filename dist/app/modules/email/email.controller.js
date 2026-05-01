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
exports.EmailController = void 0;
const email_service_1 = require("./email.service");
const catchAsync_1 = require("../../../utils/catchAsync");
const sendResponse_1 = require("../../../utils/sendResponse");
const http_status_codes_1 = require("http-status-codes");
// ───── Send Email ─────
const sendEmail = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const adminId = req.user.id;
    const result = yield email_service_1.EmailService.createAndSend(adminId, req.body);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: result.message,
        data: result,
    });
}));
// ───── Preview ─────
const preview = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { recipientType, selectedUserIds } = req.body;
    const result = yield email_service_1.EmailService.previewRecipients(recipientType, selectedUserIds);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Preview fetched successfully",
        data: result,
    });
}));
// ───── Search Users (Fixed) ─────
const searchUsers = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const q = String((_a = req.query.q) !== null && _a !== void 0 ? _a : "");
    const subscription = String((_b = req.query.subscription) !== null && _b !== void 0 ? _b : "");
    // Now passing both parameters - service function accepts 2 args
    const result = yield email_service_1.EmailService.searchUsers(q, subscription || undefined);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Users fetched successfully",
        data: result,
    });
}));
// ───── Campaigns ─────
const getAllCampaigns = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = yield email_service_1.EmailService.getAllCampaigns(page, limit);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Campaigns fetched successfully",
        data: result,
    });
}));
const getCampaignById = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield email_service_1.EmailService.getCampaignStatus(req.params.id);
    if (!result) {
        return (0, sendResponse_1.sendResponse)(res, {
            statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
            success: false,
            message: "Campaign not found",
            data: null,
        });
    }
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Campaign fetched successfully",
        data: result,
    });
}));
// ───── Logs ─────
const getCampaignLogs = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield email_service_1.EmailService.getCampaignLogs(req.params.id);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Logs fetched successfully",
        data: result,
    });
}));
// ───── User History ─────
const getUserHistory = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield email_service_1.EmailService.getUserEmailHistory(req.params.userId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "User history fetched successfully",
        data: result,
    });
}));
// ───── Summary ─────
const getCampaignSummary = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield email_service_1.EmailService.getCampaignSummary(req.params.id);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Summary fetched successfully",
        data: result,
    });
}));
// ───── Stats ─────
const getStats = (0, catchAsync_1.catchAsync)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield email_service_1.EmailService.getEmailStats();
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Stats fetched successfully",
        data: result,
    });
}));
// ───── NEW: User can see their own email history (from token) ─────
const getMyEmailHistory = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = yield email_service_1.EmailService.getMyEmailHistory(userId, page, limit);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Your email history fetched successfully",
        data: result,
    });
}));
exports.EmailController = {
    sendEmail,
    preview,
    searchUsers,
    getAllCampaigns,
    getCampaignById,
    getCampaignLogs,
    getUserHistory,
    getCampaignSummary,
    getStats,
    getMyEmailHistory,
};
