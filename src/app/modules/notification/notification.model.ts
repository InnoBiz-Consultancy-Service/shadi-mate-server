import { Schema, model } from "mongoose";
import { INotification } from "./notification.interface";

const notificationSchema = new Schema<INotification>(
    {
        recipientId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        senderId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: [
                "new_message",
                "like",
                "profile_visit",
                "subscription_expiry_reminder",
            ],
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        metadata: {
            // ─── Chat ─────────────────────────────────────────────────────────
            messageId:        { type: String },
            conversationWith: { type: String },
            // ─── Subscription reminder ────────────────────────────────────────
            daysLeft:         { type: Number },
            endDate:          { type: String },
            // ─── Report (admin) ───────────────────────────────────────────────
            reportId:         { type: String },
            reportedUserId:   { type: String },
            reason:           { type: String },
        },
    },
    { timestamps: true }
);

notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, isRead: 1 });

export const Notification = model<INotification>("Notification", notificationSchema);