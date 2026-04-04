"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Report = void 0;
const mongoose_1 = require("mongoose");
const reportSchema = new mongoose_1.Schema({
    reporterId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    reportedUserId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    reason: {
        type: String,
        enum: [
            "harassment",
            "fake_profile",
            "inappropriate_content",
            "spam",
            "hate_speech",
            "scam",
            "other",
        ],
        required: true,
    },
    details: {
        type: String,
        maxlength: 500,
    },
    status: {
        type: String,
        enum: ["pending", "reviewed", "resolved", "dismissed"],
        default: "pending",
    },
    adminNote: {
        type: String,
    },
    reviewedAt: {
        type: Date,
    },
}, { timestamps: true });
reportSchema.index({ reporterId: 1, reportedUserId: 1 }, { unique: true });
reportSchema.index({ status: 1, createdAt: -1 });
exports.Report = (0, mongoose_1.model)("Report", reportSchema);
