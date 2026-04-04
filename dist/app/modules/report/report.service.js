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
exports.ReportService = void 0;
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../../helpers/AppError"));
const report_model_1 = require("./report.model");
const user_model_1 = require("../user/user.model");
const notification_model_1 = require("../notification/notification.model");
const redis_1 = require("../../../utils/redis");
const socketSingleton_1 = require("../../../socket/handlers/socketSingleton");
const REASON_LABELS = {
    harassment: "হয়রানি",
    fake_profile: "ভুয়া প্রোফাইল",
    inappropriate_content: "অনুপযুক্ত বিষয়বস্তু",
    spam: "স্প্যাম",
    hate_speech: "ঘৃণামূলক বক্তব্য",
    scam: "প্রতারণা",
    other: "অন্যান্য",
};
// ─── Submit Report ────────────────────────────────────────────────────────────
const submitReport = (reporterId, reportedUserId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    if (reporterId === reportedUserId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "You cannot report yourself");
    }
    const reportedUser = yield user_model_1.User.findOne({
        _id: reportedUserId,
        isDeleted: false,
    }).lean();
    if (!reportedUser) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    // ─── Duplicate report check ───────────────────────────────────────────────
    const existing = yield report_model_1.Report.findOne({ reporterId, reportedUserId });
    if (existing) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.CONFLICT, "You have already reported this user. Our team is reviewing it.");
    }
    // ─── Report save ──────────────────────────────────────────────────────────
    const report = yield report_model_1.Report.create({
        reporterId,
        reportedUserId,
        reason: payload.reason,
        details: payload.details,
        status: "pending",
    });
    yield notifyAdmins(reporterId, reportedUserId, report._id.toString(), payload.reason);
    return report;
});
// ─── Admin Notification Helper ────────────────────────────────────────────────
const notifyAdmins = (reporterId, reportedUserId, reportId, reason) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const admins = yield user_model_1.User.find({ role: "admin", isDeleted: false }).select("_id").lean();
        if (!admins.length)
            return;
        const reporter = yield user_model_1.User.findById(reporterId).select("name").lean();
        const reported = yield user_model_1.User.findById(reportedUserId).select("name").lean();
        const notificationMessage = `${(_a = reporter === null || reporter === void 0 ? void 0 : reporter.name) !== null && _a !== void 0 ? _a : "কেউ"} "${(_b = reported === null || reported === void 0 ? void 0 : reported.name) !== null && _b !== void 0 ? _b : "একজন user"}" কে "${(_c = REASON_LABELS[reason]) !== null && _c !== void 0 ? _c : reason}" কারণে report করেছে`;
        const io = (0, socketSingleton_1.getIO)();
        for (const admin of admins) {
            const adminId = admin._id.toString();
            const notification = yield notification_model_1.Notification.create({
                recipientId: adminId,
                senderId: reporterId,
                type: "new_message",
                message: notificationMessage,
                isRead: false,
                metadata: {
                    reportId,
                    reportedUserId,
                    reason,
                },
            });
            const adminSocketId = yield redis_1.redisClient.hget("onlineUsers", adminId);
            if (adminSocketId) {
                io.to(adminSocketId).emit("new-report", {
                    _id: notification._id,
                    type: "report",
                    message: notificationMessage,
                    reportId,
                    reportedUserId,
                    reporterName: reporter === null || reporter === void 0 ? void 0 : reporter.name,
                    reportedName: reported === null || reported === void 0 ? void 0 : reported.name,
                    reason,
                    reasonLabel: (_d = REASON_LABELS[reason]) !== null && _d !== void 0 ? _d : reason,
                    createdAt: notification.createdAt,
                });
            }
        }
    }
    catch (err) {
        console.error("❌ Admin report notification error:", err);
    }
});
// ─── Get All Reports (Admin) ──────────────────────────────────────────────────
const getAllReports = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const filter = {};
    if (status)
        filter.status = status;
    const [reports, total] = yield Promise.all([
        report_model_1.Report.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("reporterId", "name phone")
            .populate("reportedUserId", "name phone")
            .lean(),
        report_model_1.Report.countDocuments(filter),
    ]);
    return {
        reports,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
});
// ─── Update Report Status (Admin) ─────────────────────────────────────────────
const updateReportStatus = (reportId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const report = yield report_model_1.Report.findByIdAndUpdate(reportId, {
        status: payload.status,
        adminNote: payload.adminNote,
        reviewedAt: new Date(),
    }, { new: true })
        .populate("reporterId", "name")
        .populate("reportedUserId", "name");
    if (!report) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Report not found");
    }
    return report;
});
const getMyReports = (reporterId) => __awaiter(void 0, void 0, void 0, function* () {
    const reports = yield report_model_1.Report.find({ reporterId })
        .sort({ createdAt: -1 })
        .populate("reportedUserId", "name _id")
        .lean();
    return reports.map((r) => {
        var _a;
        return ({
            reportId: r._id,
            reportedUser: {
                userId: r.reportedUserId._id,
                name: r.reportedUserId.name,
            },
            reason: r.reason,
            reasonLabel: (_a = REASON_LABELS[r.reason]) !== null && _a !== void 0 ? _a : r.reason,
            details: r.details,
            status: r.status,
            createdAt: r.createdAt,
        });
    });
});
exports.ReportService = {
    submitReport,
    getAllReports,
    updateReportStatus,
    getMyReports,
};
