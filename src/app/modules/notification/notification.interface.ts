import { Document, Types } from "mongoose";

export type TNotificationType =
    | "new_message"
    | "like"
    | "profile_visit"
    | "subscription_expiry_reminder";

export interface INotificationMetadata {
    // ─── Chat ─────────────────────────────────────────────────────────────────
    messageId?: string;
    conversationWith?: string;
    // ─── Subscription reminder ────────────────────────────────────────────────
    daysLeft?: number;
    endDate?: string;
    // ─── Report (admin) ───────────────────────────────────────────────────────
    reportId?: string;
    reportedUserId?: string;
    reason?: string;
}

export interface INotification extends Document {
    _id: Types.ObjectId;
    recipientId: Types.ObjectId;
    senderId: Types.ObjectId;
    type: TNotificationType;
    message: string;
    isRead: boolean;
    metadata: INotificationMetadata;
    createdAt: Date;
    updatedAt: Date;
}