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
exports.ReportController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = require("../../../utils/catchAsync");
const sendResponse_1 = require("../../../utils/sendResponse");
const report_service_1 = require("./report.service");
// ─── Submit Report ────────────────────────────────────────────────────────────
const submitReport = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const reporterId = req.user.id;
    const reportedUserId = req.params.userId;
    const { reason, details } = req.body;
    const result = yield report_service_1.ReportService.submitReport(reporterId, reportedUserId, {
        reason,
        details,
    });
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: "Report submitted successfully. Our team will review it shortly.",
        data: {
            reportId: result._id,
            reason: result.reason,
            status: result.status,
        },
    });
}));
// ─── Get My Reports ───────────────────────────────────────────────────────────
const getMyReports = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const reporterId = req.user.id;
    const result = yield report_service_1.ReportService.getMyReports(reporterId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Your reports fetched successfully",
        data: result,
    });
}));
// ─── Get All Reports — Admin Only ─────────────────────────────────────────────
const getAllReports = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { status, page, limit } = req.query;
    const result = yield report_service_1.ReportService.getAllReports({
        status: status,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
    });
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Reports fetched successfully",
        data: result.reports,
        meta: result.meta,
    });
}));
// ─── Update Report Status — Admin Only ───────────────────────────────────────
const updateReportStatus = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const reportId = req.params.id;
    const { status, adminNote } = req.body;
    const result = yield report_service_1.ReportService.updateReportStatus(reportId, {
        status,
        adminNote,
    });
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Report status updated",
        data: result,
    });
}));
exports.ReportController = {
    submitReport,
    getMyReports,
    getAllReports,
    updateReportStatus,
};
