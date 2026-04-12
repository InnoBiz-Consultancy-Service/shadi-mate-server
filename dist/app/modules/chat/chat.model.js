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
}, { timestamps: true });
// ─── Message Indexes ──────────────────────────────────────────────────────────
//
// FIX: আগে 4টা index ছিল — {senderId,createdAt} redundant ছিল।
// MongoDB prefix rule: compound {senderId,receiverId,createdAt} এর
// left prefix হিসেবে {senderId} query automatically covered।
// Extra index শুধু write overhead বাড়ায়।
//
// getChatHistory $or filter:
//   [{senderId:X,receiverId:Y},{senderId:Y,receiverId:X}]
//   → দুটো branch-ই compound index hit করে।
//
// mark-as-seen: {receiverId, status:{$ne:"seen"}} → second index hit করে।
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 }); // chat history
messageSchema.index({ receiverId: 1, status: 1 }); // mark-as-seen
exports.Message = (0, mongoose_1.model)("Message", messageSchema);
// ─── Conversation Schema ──────────────────────────────────────────────────────
//
// FIX (Critical): আগের code-এ participantIds array-তে {unique:true} দেওয়া হয়েছিল।
// MongoDB-তে array-এ unique index প্রতিটা element-কে unique ধরে, পুরো array-কে নয়।
// ফলে [A,B] এবং [B,A] দুটো আলাদা document তৈরি হতো — duplicate conversation।
//
// Solution: participantKey — "smallerId_largerId" format-এ sorted string।
// Sort করা থাকায় [A,B] এবং [B,A] সবসময় একই key তৈরি করে।
// এই field-এ unique index → 50,000 concurrent upsert-এও race condition নেই।
const conversationSchema = new mongoose_1.Schema({
    // "smallerObjectId_largerObjectId" — handler সর্বদা এটা sorted বানিয়ে দেয়
    participantKey: {
        type: String,
        required: true,
        unique: true, // এখানেই real uniqueness enforce হয়
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
    // FIX: Map এর বদলে Mixed ব্যবহার।
    // lean() করার পর Mongoose Map → plain object হয়, .get() method থাকে না।
    // Mixed = always plain object, direct key access কাজ করে নিশ্চিতভাবে।
    unreadCounts: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
}, { timestamps: true });
// participantKey-এ unique index schema-তেই আছে।
// এই index conversation list query-এর জন্য।
conversationSchema.index({ participantIds: 1, lastMessageAt: -1 });
exports.Conversation = (0, mongoose_1.model)("Conversation", conversationSchema);
