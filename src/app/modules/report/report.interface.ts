import { Document, Types } from "mongoose";

export type TReportReason =
    | "harassment"
    | "fake_profile"
    | "inappropriate_content"
    | "spam"
    | "hate_speech"
    | "scam"
    | "other";

export type TReportStatus = "pending" | "reviewed" | "resolved" | "dismissed";

export interface IReport extends Document {
    _id: Types.ObjectId;
    reporterId: Types.ObjectId;
    reportedUserId: Types.ObjectId;
    reason: TReportReason;
    details?: string;
    status: TReportStatus;
    adminNote?: string;
    reviewedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}