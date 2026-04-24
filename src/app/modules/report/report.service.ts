import { StatusCodes } from "http-status-codes";
import AppError from "../../../helpers/AppError";
import { Report } from "./report.model";
import { User } from "../user/user.model";
import { Notification } from "../notification/notification.model";
import { getIO } from "../../../socket/handlers/socketSingleton";
import redisClient from "../../../utils/redis";

const REASON_LABELS: Record<string, string> = {
    harassment: "harassment",
    fake_profile: "fake profile",
    inappropriate_content: "inappropriate content",
    spam: "spam",
    hate_speech: "hate speech",
    scam: "scam",
    other: "other",
};

// ─── Submit Report ────────────────────────────────────────────────────────────
const submitReport = async (
    reporterId: string,
    reportedUserId: string,
    payload: { reason: string; details?: string }
) => {
    if (reporterId === reportedUserId) {
        throw new AppError(StatusCodes.BAD_REQUEST, "You cannot report yourself");
    }

    const reportedUser = await User.findOne({
        _id: reportedUserId,
        isDeleted: false,
    }).lean();

    if (!reportedUser) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }

    // ─── Duplicate report check ───────────────────────────────────────────────
    const existing = await Report.findOne({ reporterId, reportedUserId });
    if (existing) {
        throw new AppError(
            StatusCodes.CONFLICT,
            "You have already reported this user. Our team is reviewing it."
        );
    }

    // ─── Report save ──────────────────────────────────────────────────────────
    const report = await Report.create({
        reporterId,
        reportedUserId,
        reason: payload.reason,
        details: payload.details,
        status: "pending",
    });

    await notifyAdmins(reporterId, reportedUserId, report._id.toString(), payload.reason);

    return report;
};

// ─── Admin Notification Helper ────────────────────────────────────────────────
const notifyAdmins = async (
    reporterId: string,
    reportedUserId: string,
    reportId: string,
    reason: string
) => {
    try {
        const admins = await User.find({ role: "admin", isDeleted: false }).select("_id").lean();

        if (!admins.length) return;

        const reporter = await User.findById(reporterId).select("name").lean();
        const reported = await User.findById(reportedUserId).select("name").lean();

        const notificationMessage = `${reporter?.name ?? "কেউ"} "${reported?.name ?? "একজন user"}" কে "${REASON_LABELS[reason] ?? reason}" কারণে report করেছে`;

        const io = getIO();

        for (const admin of admins) {
            const adminId = admin._id.toString();

            const notification = await Notification.create({
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

            const adminSocketId = await redisClient.hGet("onlineUsers", adminId);
            if (adminSocketId) {
                io.to(String(adminSocketId)).emit("new-report", {
                    _id: notification._id,
                    type: "report",
                    message: notificationMessage,
                    reportId,
                    reportedUserId,
                    reporterName: reporter?.name,
                    reportedName: reported?.name,
                    reason,
                    reasonLabel: REASON_LABELS[reason] ?? reason,
                    createdAt: notification.createdAt,
                });
            }
        }
    } catch (err) {
        console.error("❌ Admin report notification error:", err);
    }
};

// ─── Get All Reports (Admin) ──────────────────────────────────────────────────
const getAllReports = async (
    query: { status?: string; page?: number; limit?: number }
) => {
    const { status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (status) filter.status = status;

    const [reports, total] = await Promise.all([
        Report.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("reporterId", "name phone")
            .populate("reportedUserId", "name phone")
            .lean(),
        Report.countDocuments(filter),
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
};

// ─── Update Report Status (Admin) ─────────────────────────────────────────────
const updateReportStatus = async (
    reportId: string,
    payload: { status: string; adminNote?: string }
) => {
    const report = await Report.findByIdAndUpdate(
        reportId,
        {
            status: payload.status,
            adminNote: payload.adminNote,
            reviewedAt: new Date(),
        },
        { new: true }
    )
        .populate("reporterId", "name")
        .populate("reportedUserId", "name");

    if (!report) {
        throw new AppError(StatusCodes.NOT_FOUND, "Report not found");
    }

    return report;
};

const getMyReports = async (reporterId: string) => {
    const reports = await Report.find({ reporterId })
        .sort({ createdAt: -1 })
        .populate("reportedUserId", "name _id")
        .lean();

    return reports.map((r: any) => ({
        reportId: r._id,
        reportedUser: {
            userId: r.reportedUserId._id,
            name: r.reportedUserId.name,
        },
        reason: r.reason,
        reasonLabel: REASON_LABELS[r.reason] ?? r.reason,
        details: r.details,
        status: r.status,
        createdAt: r.createdAt,
    }));
};

export const ReportService = {
    submitReport,
    getAllReports,
    updateReportStatus,
    getMyReports,
};