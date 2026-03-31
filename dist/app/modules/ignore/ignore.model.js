"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IgnoredMessage = exports.Ignore = void 0;
const mongoose_1 = require("mongoose");
const ignoreSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    ignoredUserId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, { timestamps: true });
ignoreSchema.index({ userId: 1, ignoredUserId: 1 }, { unique: true });
ignoreSchema.index({ userId: 1 });
exports.Ignore = (0, mongoose_1.model)("Ignore", ignoreSchema);
// ─── Ignored Message Schema ───────────────────────────────────────────────────
const ignoredMessageSchema = new mongoose_1.Schema({
    senderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    receiverId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, { timestamps: true });
ignoredMessageSchema.index({ receiverId: 1, createdAt: -1 });
ignoredMessageSchema.index({ senderId: 1, receiverId: 1 });
exports.IgnoredMessage = (0, mongoose_1.model)("IgnoredMessage", ignoredMessageSchema);
