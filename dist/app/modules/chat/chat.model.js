"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Conversation = exports.Message = void 0;
const mongoose_1 = require("mongoose");
// ─── Message Schema ───────────────────────────────────────────────────────────
const messageSchema = new mongoose_1.Schema({
    senderId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
        type: String,
        enum: ["text", "image", "file", "voice"],
        default: "text",
    },
    content: { type: String, required: true },
    status: {
        type: String,
        enum: ["sent", "delivered", "seen"],
        default: "sent",
    },
    imageUrl: { type: String },
    fileUrl: { type: String },
    voiceUrl: { type: String },
}, { timestamps: true });
// ─── Message Indexes ──────────────────────────────────────────────────────────
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, senderId: 1, status: 1 });
exports.Message = (0, mongoose_1.model)("Message", messageSchema);
const conversationSchema = new mongoose_1.Schema({
    participantKey: {
        type: String,
        required: true,
        unique: true,
    },
    participantIds: {
        type: [mongoose_1.Schema.Types.ObjectId],
        required: true,
    },
    lastMessage: { type: String, default: "" },
    lastMessageType: {
        type: String,
        enum: ["text", "image", "file", "voice"],
        default: "text",
    },
    lastMessageSenderId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    lastMessageAt: { type: Date, default: Date.now },
    lastMessageStatus: {
        type: String,
        enum: ["sent", "delivered", "seen"],
        default: "sent",
    },
    unreadCounts: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
}, { timestamps: true });
// participantKey-এ unique index schema-তেই আছে।
// এই index conversation list query-এর জন্য।
conversationSchema.index({ participantIds: 1, lastMessageAt: -1 });
exports.Conversation = (0, mongoose_1.model)("Conversation", conversationSchema);
