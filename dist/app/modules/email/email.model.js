"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailLog = exports.EmailCampaign = void 0;
const mongoose_1 = require("mongoose");
const emailCampaignSchema = new mongoose_1.Schema({
    subject: {
        type: String,
        required: true,
        trim: true,
    },
    body: {
        type: String,
        required: true,
    },
    recipientType: {
        type: String,
        enum: ["all", "free", "premium", "selected"],
        required: true,
    },
    selectedUserIds: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    totalRecipients: {
        type: Number,
        default: 0,
    },
    sentCount: {
        type: Number,
        default: 0,
    },
    failedCount: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ["pending", "sending", "sent", "failed"],
        default: "pending",
    },
    sentBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    startedAt: {
        type: Date,
    },
    completedAt: {
        type: Date,
    },
}, { timestamps: true });
emailCampaignSchema.index({ status: 1, createdAt: -1 });
emailCampaignSchema.index({ sentBy: 1 });
exports.EmailCampaign = (0, mongoose_1.model)("EmailCampaign", emailCampaignSchema);
const emailLogSchema = new mongoose_1.Schema({
    campaignId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "EmailCampaign",
        required: true,
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    email: String,
    name: String,
    status: {
        type: String,
        enum: ["sent", "failed"],
        required: true,
    },
    error: String,
}, { timestamps: true });
emailLogSchema.index({ campaignId: 1 });
emailLogSchema.index({ userId: 1 });
exports.EmailLog = (0, mongoose_1.model)("EmailLog", emailLogSchema);
