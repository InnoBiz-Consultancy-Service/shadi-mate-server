import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../../utils/catchAsync";
import { sendResponse } from "../../../utils/sendResponse";
import { ReportService } from "./report.service";

// ─── Submit Report ────────────────────────────────────────────────────────────
const submitReport = catchAsync(async (req: Request, res: Response) => {
    const reporterId = (req as any).user.id;
    const reportedUserId = req.params.userId;
    const { reason, details } = req.body;

    const result = await ReportService.submitReport(reporterId, reportedUserId, {
        reason,
        details,
    });

    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: "Report submitted successfully. Our team will review it shortly.",
        data: {
            reportId: result._id,
            reason: result.reason,
            status: result.status,
        },
    });
});

// ─── Get My Reports ───────────────────────────────────────────────────────────
const getMyReports = catchAsync(async (req: Request, res: Response) => {
    const reporterId = (req as any).user.id;
    const result = await ReportService.getMyReports(reporterId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Your reports fetched successfully",
        data: result,
    });
});

// ─── Get All Reports — Admin Only ─────────────────────────────────────────────
const getAllReports = catchAsync(async (req: Request, res: Response) => {
    const { status, page, limit } = req.query;

    const result = await ReportService.getAllReports({
        status: status as string,
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 20,
    });

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Reports fetched successfully",
        data: result.reports,
        meta: result.meta as any,
    });
});

// ─── Update Report Status — Admin Only ───────────────────────────────────────
const updateReportStatus = catchAsync(async (req: Request, res: Response) => {
    const reportId = req.params.id;
    const { status, adminNote } = req.body;

    const result = await ReportService.updateReportStatus(reportId, {
        status,
        adminNote,
    });

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Report status updated",
        data: result,
    });
});

export const ReportController = {
    submitReport,
    getMyReports,
    getAllReports,
    updateReportStatus,
};