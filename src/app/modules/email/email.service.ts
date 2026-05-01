import nodemailer from "nodemailer";
import { Types } from "mongoose";
import AppError from "../../../helpers/AppError";
import { StatusCodes } from "http-status-codes";

import { EmailCampaign, EmailLog } from "./email.model";

import { User } from "../user/user.model";
import { generateShadiMateEmailTemplate } from "./email.template";

type RecipientType = "all" | "free" | "premium" | "selected";

// ───── Transport ─────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ───── Send Single Email ─────
const sendOne = async (to: string, subject: string, html: string) => {
  try {
    await transporter.sendMail({
      from: `"ShadiMate ✨" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch {
    return false;
  }
};

// ───── Query Builder ─────
const buildQuery = (type: RecipientType, ids?: string[]) => {
  const base = { isDeleted: false, isBlocked: false, isVerified: true };

  if (type === "free") return { ...base, subscription: "free" };
  if (type === "premium") return { ...base, subscription: "premium" };

  if (type === "selected") {
    if (!ids?.length) throw new AppError(400, "No users selected");
    return { ...base, _id: { $in: ids.map(id => new Types.ObjectId(id)) } };
  }

  return base;
};

// ───── Fetch Users ─────
const fetchUsers = async (type: RecipientType, ids?: string[]) => {
  return User.find(buildQuery(type, ids)).select("_id name email");
};

// ───── Create + Send ─────
const createAndSend = async (adminId: string, payload: any) => {
  const { subject, body, recipientType, selectedUserIds } = payload;

  const users = await fetchUsers(recipientType, selectedUserIds);

  const campaign = await EmailCampaign.create({
    subject,
    body,
    recipientType,
    selectedUserIds: selectedUserIds?.map((id: string) => new Types.ObjectId(id)),
    totalRecipients: users.length,
    sentBy: new Types.ObjectId(adminId),
  });

  let sent = 0;
  let failed = 0;

  for (const user of users) {
    const html = generateShadiMateEmailTemplate({
      subject,
      body,
      recipientName: user.name,
    });

    const ok = await sendOne(user.email, subject, html);

    await EmailLog.create({
      campaignId: campaign._id,
      userId: user._id,
      email: user.email,
      name: user.name,
      status: ok ? "sent" : "failed",
    });

    ok ? sent++ : failed++;
  }

  await EmailCampaign.findByIdAndUpdate(campaign._id, {
    status: "sent",
    sentCount: sent,
    failedCount: failed,
  });

  return {
    campaignId: campaign._id,
    sent,
    failed,
    message: `Campaign completed: ${sent} sent, ${failed} failed`,
  };
};

// ───── Preview ─────
const previewRecipients = async (type: RecipientType, ids?: string[]) => {
  const users = await fetchUsers(type, ids);

  return {
    count: users.length,
    sample: users.slice(0, 5),
  };
};

// ───── Logs ─────
const getCampaignLogs = async (id: string) => {
  return EmailLog.find({ campaignId: id }).populate("userId", "name email");
};

// ───── User History ─────
const getUserEmailHistory = async (userId: string) => {
  return EmailLog.find({ userId }).populate("campaignId", "subject");
};

// ───── Summary ─────
const getCampaignSummary = async (id: string) => {
  const campaign = await EmailCampaign.findById(id);
  const logs = await EmailLog.find({ campaignId: id });

  return {
    campaign,
    sent: logs.filter((l: { status: string }) => l.status === "sent").length,
    failed: logs.filter((l: { status: string }) => l.status === "failed").length,
  };
};

// ───── Campaigns ─────
const getAllCampaigns = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const campaigns = await EmailCampaign.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await EmailCampaign.countDocuments();

  return {
    campaigns,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

const getCampaignStatus = async (id: string) => {
  return EmailCampaign.findById(id);
};

// ───── Search Users (Fixed - now accepts 2 parameters) ─────
const searchUsers = async (q: string, subscription?: string) => {
  if (!q) return [];

  const filter: any = {
    isDeleted: false,
    isBlocked: false,
    $or: [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
    ],
  };

  // Add subscription filter if provided
  if (subscription && subscription !== "all") {
    filter.subscription = subscription;
  }

  return User.find(filter)
    .select("_id name email subscription")
    .limit(20);
};

// ───── Stats ─────
const getEmailStats = async () => {
  const total = await EmailCampaign.countDocuments();
  const sent = await EmailCampaign.countDocuments({ status: "sent" });
  const failed = await EmailCampaign.countDocuments({ status: "failed" });

  const totalEmailsSent = await EmailLog.countDocuments({ status: "sent" });
  const totalEmailsFailed = await EmailLog.countDocuments({ status: "failed" });

  return { 
    total, 
    sent, 
    failed,
    totalEmailsSent,
    totalEmailsFailed 
  };
};
// ───── NEW: User can see their own email history (from token) ─────
const getMyEmailHistory = async (userId: string, page: number = 1, limit: number = 20) => {
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    EmailLog.find({ userId: new Types.ObjectId(userId) })
      .populate("campaignId", "subject body status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    EmailLog.countDocuments({ userId: new Types.ObjectId(userId) })
  ]);

  return {
    emails: logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};
export const EmailService = {
  createAndSend,
  previewRecipients,
  getCampaignLogs,
  getUserEmailHistory,
  getCampaignSummary,
  getAllCampaigns,
  getCampaignStatus,
  searchUsers,
  getEmailStats,
  getMyEmailHistory
};