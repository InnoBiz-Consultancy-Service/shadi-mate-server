"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
const mongoose_1 = require("mongoose");
const notificationSchema = new mongoose_1.Schema({
    recipientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    senderId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, { timestamps: true });
// ─── Index: recipientId দিয়ে fast query ──────────────────────────────────────
notificationSchema.index({ recipientId: 1, createdAt: -1 });
// ─── Index: unread count fast fetch ──────────────────────────────────────────
notificationSchema.index({ recipientId: 1, isRead: 1 });
exports.Notification = (0, mongoose_1.model)("Notification", notificationSchema);
