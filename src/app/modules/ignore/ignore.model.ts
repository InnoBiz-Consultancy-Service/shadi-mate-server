import { Schema, model } from "mongoose";
import { IIgnore } from "./ignore.interface";

const ignoreSchema = new Schema<IIgnore>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        ignoredUserId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

ignoreSchema.index({ userId: 1, ignoredUserId: 1 }, { unique: true });

ignoreSchema.index({ userId: 1 });

export const Ignore = model<IIgnore>("Ignore", ignoreSchema);


// ─── Ignored Message Schema ───────────────────────────────────────────────────


const ignoredMessageSchema = new Schema(
    {
        senderId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        receiverId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: ["text", "image", "file", "voice"],
            default: "text",
        },
        content: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["sent", "delivered", "seen"],
            default: "sent",
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

ignoredMessageSchema.index({ receiverId: 1, createdAt: -1 });
ignoredMessageSchema.index({ senderId: 1, receiverId: 1 });

export const IgnoredMessage = model("IgnoredMessage", ignoredMessageSchema);