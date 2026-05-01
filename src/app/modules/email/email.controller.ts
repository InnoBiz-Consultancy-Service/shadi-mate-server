import { Request, Response } from "express";
import { EmailService } from "./email.service";
import { catchAsync } from "../../../utils/catchAsync";
import { sendResponse } from "../../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";

// ───── Send Email ─────
const sendEmail = catchAsync(async (req: Request, res: Response) => {
  const adminId = (req as any).user.id;

  const result = await EmailService.createAndSend(adminId, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

// ───── Preview ─────
const preview = catchAsync(async (req: Request, res: Response) => {
  const { recipientType, selectedUserIds } = req.body;

  const result = await EmailService.previewRecipients(
    recipientType,
    selectedUserIds
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Preview fetched successfully",
    data: result,
  });
});

// ───── Search Users (Fixed) ─────
const searchUsers = catchAsync(async (req: Request, res: Response) => {
  const q = String(req.query.q ?? "");
  const subscription = String(req.query.subscription ?? "");

  // Now passing both parameters - service function accepts 2 args
  const result = await EmailService.searchUsers(q, subscription || undefined);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Users fetched successfully",
    data: result,
  });
});

// ───── Campaigns ─────
const getAllCampaigns = catchAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const result = await EmailService.getAllCampaigns(page, limit);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Campaigns fetched successfully",
    data: result,
  });
});

const getCampaignById = catchAsync(async (req: Request, res: Response) => {
  const result = await EmailService.getCampaignStatus(req.params.id);

  if (!result) {
    return sendResponse(res, {
      statusCode: StatusCodes.NOT_FOUND,
      success: false,
      message: "Campaign not found",
      data: null,
    });
  }

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Campaign fetched successfully",
    data: result,
  });
});

// ───── Logs ─────
const getCampaignLogs = catchAsync(async (req: Request, res: Response) => {
  const result = await EmailService.getCampaignLogs(req.params.id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Logs fetched successfully",
    data: result,
  });
});

// ───── User History ─────
const getUserHistory = catchAsync(async (req: Request, res: Response) => {
  const result = await EmailService.getUserEmailHistory(req.params.userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User history fetched successfully",
    data: result,
  });
});

// ───── Summary ─────
const getCampaignSummary = catchAsync(async (req: Request, res: Response) => {
  const result = await EmailService.getCampaignSummary(req.params.id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Summary fetched successfully",
    data: result,
  });
});

// ───── Stats ─────
const getStats = catchAsync(async (_req: Request, res: Response) => {
  const result = await EmailService.getEmailStats();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Stats fetched successfully",
    data: result,
  });
});
// ───── NEW: User can see their own email history (from token) ─────
const getMyEmailHistory = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const result = await EmailService.getMyEmailHistory(userId, page, limit);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Your email history fetched successfully",
    data: result,
  });
});


export const EmailController = {
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