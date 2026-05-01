import { Document, Types } from "mongoose";

export type TEmailRecipientType = "all" | "free" | "premium" | "selected";
export type TEmailStatus = "pending" | "sending" | "sent" | "failed";

export interface IEmailCampaign extends Document {
    _id: Types.ObjectId;
    subject: string;
    body: string;
    recipientType: TEmailRecipientType;
    selectedUserIds?: Types.ObjectId[];
    totalRecipients: number;
    sentCount: number;
    failedCount: number;
    status: TEmailStatus;
    sentBy: Types.ObjectId;
    startedAt?: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
