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
exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const mongoose_1 = require("mongoose");
const AppError_1 = __importDefault(require("../../../helpers/AppError"));
const email_model_1 = require("./email.model");
const user_model_1 = require("../user/user.model");
const email_template_1 = require("./email.template");
// ───── Transport ─────
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
// ───── Send Single Email ─────
const sendOne = (to, subject, html) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield transporter.sendMail({
            from: `"ShadiMate ✨" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
        });
        return true;
    }
    catch (_a) {
        return false;
    }
});
// ───── Query Builder ─────
const buildQuery = (type, ids) => {
    const base = { isDeleted: false, isBlocked: false, isVerified: true };
    if (type === "free")
        return Object.assign(Object.assign({}, base), { subscription: "free" });
    if (type === "premium")
        return Object.assign(Object.assign({}, base), { subscription: "premium" });
    if (type === "selected") {
        if (!(ids === null || ids === void 0 ? void 0 : ids.length))
            throw new AppError_1.default(400, "No users selected");
        return Object.assign(Object.assign({}, base), { _id: { $in: ids.map(id => new mongoose_1.Types.ObjectId(id)) } });
    }
    return base;
};
// ───── Fetch Users ─────
const fetchUsers = (type, ids) => __awaiter(void 0, void 0, void 0, function* () {
    return user_model_1.User.find(buildQuery(type, ids)).select("_id name email");
});
// ───── Create + Send ─────
const createAndSend = (adminId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { subject, body, recipientType, selectedUserIds } = payload;
    const users = yield fetchUsers(recipientType, selectedUserIds);
    const campaign = yield email_model_1.EmailCampaign.create({
        subject,
        body,
        recipientType,
        selectedUserIds: selectedUserIds === null || selectedUserIds === void 0 ? void 0 : selectedUserIds.map((id) => new mongoose_1.Types.ObjectId(id)),
        totalRecipients: users.length,
        sentBy: new mongoose_1.Types.ObjectId(adminId),
    });
    let sent = 0;
    let failed = 0;
    for (const user of users) {
        const html = (0, email_template_1.generateShadiMateEmailTemplate)({
            subject,
            body,
            recipientName: user.name,
        });
        const ok = yield sendOne(user.email, subject, html);
        yield email_model_1.EmailLog.create({
            campaignId: campaign._id,
            userId: user._id,
            email: user.email,
            name: user.name,
            status: ok ? "sent" : "failed",
        });
        ok ? sent++ : failed++;
    }
    yield email_model_1.EmailCampaign.findByIdAndUpdate(campaign._id, {
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
});
// ───── Preview ─────
const previewRecipients = (type, ids) => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield fetchUsers(type, ids);
    return {
        count: users.length,
        sample: users.slice(0, 5),
    };
});
// ───── Logs ─────
const getCampaignLogs = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return email_model_1.EmailLog.find({ campaignId: id }).populate("userId", "name email");
});
// ───── User History ─────
const getUserEmailHistory = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return email_model_1.EmailLog.find({ userId }).populate("campaignId", "subject");
});
// ───── Summary ─────
const getCampaignSummary = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const campaign = yield email_model_1.EmailCampaign.findById(id);
    const logs = yield email_model_1.EmailLog.find({ campaignId: id });
    return {
        campaign,
        sent: logs.filter((l) => l.status === "sent").length,
        failed: logs.filter((l) => l.status === "failed").length,
    };
});
// ───── Campaigns ─────
const getAllCampaigns = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const campaigns = yield email_model_1.EmailCampaign.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    const total = yield email_model_1.EmailCampaign.countDocuments();
    return {
        campaigns,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    };
});
const getCampaignStatus = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return email_model_1.EmailCampaign.findById(id);
});
// ───── Search Users (Fixed - now accepts 2 parameters) ─────
const searchUsers = (q, subscription) => __awaiter(void 0, void 0, void 0, function* () {
    if (!q)
        return [];
    const filter = {
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
    return user_model_1.User.find(filter)
        .select("_id name email subscription")
        .limit(20);
});
// ───── Stats ─────
const getEmailStats = () => __awaiter(void 0, void 0, void 0, function* () {
    const total = yield email_model_1.EmailCampaign.countDocuments();
    const sent = yield email_model_1.EmailCampaign.countDocuments({ status: "sent" });
    const failed = yield email_model_1.EmailCampaign.countDocuments({ status: "failed" });
    const totalEmailsSent = yield email_model_1.EmailLog.countDocuments({ status: "sent" });
    const totalEmailsFailed = yield email_model_1.EmailLog.countDocuments({ status: "failed" });
    return {
        total,
        sent,
        failed,
        totalEmailsSent,
        totalEmailsFailed
    };
});
// ───── NEW: User can see their own email history (from token) ─────
const getMyEmailHistory = (userId_1, ...args_1) => __awaiter(void 0, [userId_1, ...args_1], void 0, function* (userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [logs, total] = yield Promise.all([
        email_model_1.EmailLog.find({ userId: new mongoose_1.Types.ObjectId(userId) })
            .populate("campaignId", "subject body status")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        email_model_1.EmailLog.countDocuments({ userId: new mongoose_1.Types.ObjectId(userId) })
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
});
exports.EmailService = {
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
