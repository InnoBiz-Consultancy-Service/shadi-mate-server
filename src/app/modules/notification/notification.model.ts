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
            enum: ["new_message", "like", "profile_visit"],
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
            messageId: { type: String },
            conversationWith: { type: String },
        },
    },
    { timestamps: true }
);

// ─── Index: recipientId দিয়ে fast query ──────────────────────────────────────
notificationSchema.index({ recipientId: 1, createdAt: -1 });
// ─── Index: unread count fast fetch ──────────────────────────────────────────
notificationSchema.index({ recipientId: 1, isRead: 1 });

export const Notification = model<INotification>("Notification", notificationSchema);