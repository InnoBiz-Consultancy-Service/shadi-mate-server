import { Schema, model } from "mongoose";
import { IReport, TReportReason, TReportStatus } from "./report.interface";

const reportSchema = new Schema<IReport>(
    {
        reporterId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        reportedUserId: {
            type: Schema.Types.ObjectId,
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
            ] as TReportReason[],
            required: true,
        },
        details: {
            type: String,
            maxlength: 500,
        },
        status: {
            type: String,
            enum: ["pending", "reviewed", "resolved", "dismissed"] as TReportStatus[],
            default: "pending",
        },
        adminNote: {
            type: String,
        },
        reviewedAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

reportSchema.index({ reporterId: 1, reportedUserId: 1 }, { unique: true });


reportSchema.index({ status: 1, createdAt: -1 });

export const Report = model<IReport>("Report", reportSchema);