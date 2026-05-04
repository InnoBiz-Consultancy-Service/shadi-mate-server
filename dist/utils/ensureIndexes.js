"use strict";
// src/utils/ensureIndexes.ts
// ─── CHANGE 5: MongoDB Indexes ────────────────────────────────────────────────
// server.ts এ seedGeoData() এর পরে call করো: ensureIndexes()
// Indexes ছাড়া MongoDB full collection scan করে → slow
// এই indexes গুলো সব heavy query কে fast করবে
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureIndexes = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const ensureIndexes = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = mongoose_1.default.connection.db;
        if (!db)
            return;
        console.log("📦 Ensuring MongoDB indexes...");
        // ── Users ──────────────────────────────────────────────────────────────────
        // auth middleware এ প্রতিটা request এ User.findById() হয়
        // isDeleted + isBlocked check এর জন্য compound index
        yield db.collection("users").createIndexes([
            { key: { _id: 1 }, name: "users_id" },
            { key: { phone: 1 }, unique: true, name: "users_phone" },
            { key: { email: 1 }, unique: true, name: "users_email" },
            { key: { isDeleted: 1, isBlocked: 1, isVerified: 1 }, name: "users_status" },
            { key: { role: 1, isDeleted: 1 }, name: "users_role" },
            { key: { subscription: 1, isDeleted: 1, isBlocked: 1 }, name: "users_subscription" },
        ]);
        // ── Profiles ───────────────────────────────────────────────────────────────
        // getProfiles aggregation: userId + gender filter
        // dreamPartner: religion.practiceLevel, economicalStatus, habits
        // age filter: birthDate
        yield db.collection("profiles").createIndexes([
            { key: { userId: 1 }, unique: true, name: "profiles_userId" },
            { key: { personality: 1 }, name: "profiles_personality" },
            { key: { economicalStatus: 1 }, name: "profiles_economical" },
            { key: { "religion.practiceLevel": 1 }, name: "profiles_practiceLevel" },
            { key: { "religion.faith": 1 }, name: "profiles_faith" },
            { key: { "address.divisionId": 1 }, name: "profiles_division" },
            { key: { "address.districtId": 1 }, name: "profiles_district" },
            { key: { birthDate: -1 }, name: "profiles_birthDate" },
            { key: { habits: 1 }, name: "profiles_habits" },
            { key: { createdAt: -1 }, name: "profiles_createdAt" },
            // getProfiles এর main query: opposite gender + not self
            // এই compound index টা সবচেয়ে বেশি use হবে
            { key: { "address.divisionId": 1, createdAt: -1 }, name: "profiles_division_created" },
        ]);
        // ── Messages ───────────────────────────────────────────────────────────────
        // getChatHistory: senderId+receiverId pair query
        // mark as seen: receiverId+status update
        yield db.collection("messages").createIndexes([
            { key: { senderId: 1, receiverId: 1, createdAt: -1 }, name: "messages_pair_time" },
            { key: { receiverId: 1, senderId: 1, status: 1 }, name: "messages_seen_update" },
            { key: { createdAt: -1 }, name: "messages_created" },
        ]);
        // ── Conversations ──────────────────────────────────────────────────────────
        // getConversationList: participantIds এ আমার ID খোঁজা
        // lastMessageAt sort এর জন্য compound index
        yield db.collection("conversations").createIndexes([
            { key: { participantKey: 1 }, unique: true, name: "conversations_key" },
            { key: { participantIds: 1, lastMessageAt: -1 }, name: "conversations_participants_time" },
            { key: { lastMessageAt: -1 }, name: "conversations_lastMessage" },
        ]);
        // ── Notifications ──────────────────────────────────────────────────────────
        // getMyNotifications: recipientId + sort by createdAt
        // unread count: recipientId + isRead
        yield db.collection("notifications").createIndexes([
            { key: { recipientId: 1, createdAt: -1 }, name: "notifications_recipient_time" },
            { key: { recipientId: 1, isRead: 1 }, name: "notifications_unread" },
        ]);
        // ── Likes ──────────────────────────────────────────────────────────────────
        // toggleLike: fromUserId+toUserId unique check
        // getLikeCount: toUserId count
        yield db.collection("likes").createIndexes([
            { key: { fromUserId: 1, toUserId: 1 }, unique: true, name: "likes_pair" },
            { key: { toUserId: 1 }, name: "likes_to" },
            { key: { fromUserId: 1 }, name: "likes_from" },
        ]);
        // ── Blocks ─────────────────────────────────────────────────────────────────
        yield db.collection("blocks").createIndexes([
            { key: { blockerId: 1, blockedId: 1 }, unique: true, name: "blocks_pair" },
            { key: { blockerId: 1 }, name: "blocks_blocker" },
            { key: { blockedId: 1 }, name: "blocks_blocked" },
        ]);
        // ── Ignores ────────────────────────────────────────────────────────────────
        yield db.collection("ignores").createIndexes([
            { key: { userId: 1, ignoredUserId: 1 }, unique: true, name: "ignores_pair" },
            { key: { userId: 1 }, name: "ignores_user" },
        ]);
        // ── Reports ────────────────────────────────────────────────────────────────
        yield db.collection("reports").createIndexes([
            { key: { reporterId: 1, reportedUserId: 1 }, unique: true, name: "reports_pair" },
            { key: { status: 1, createdAt: -1 }, name: "reports_status_time" },
        ]);
        // ── Profile Visits ─────────────────────────────────────────────────────────
        yield db.collection("profilevisits").createIndexes([
            { key: { visitorId: 1, profileOwnerId: 1 }, unique: true, name: "visits_pair" },
            { key: { profileOwnerId: 1, visitedAt: -1 }, name: "visits_owner_time" },
        ]);
        // ── Subscriptions ──────────────────────────────────────────────────────────
        // expireSubscriptions cron: endDate + status
        yield db.collection("subscriptions").createIndexes([
            { key: { userId: 1, status: 1 }, name: "subs_user_status" },
            { key: { endDate: 1, status: 1 }, name: "subs_expire" },
        ]);
        // ── Payments ───────────────────────────────────────────────────────────────
        yield db.collection("payments").createIndexes([
            { key: { merchantTransactionId: 1 }, unique: true, name: "payments_txid" },
            { key: { userId: 1, createdAt: -1 }, name: "payments_user_time" },
        ]);
        // ── Albums ─────────────────────────────────────────────────────────────────
        yield db.collection("albums").createIndexes([
            { key: { userId: 1 }, unique: true, name: "albums_userId" },
        ]);
        // ── Dream Partner Preferences ──────────────────────────────────────────────
        yield db.collection("dreampartnerpreferences").createIndexes([
            { key: { userId: 1 }, unique: true, name: "dreampartner_userId" },
            { key: { practiceLevel: 1 }, name: "dreampartner_practice" },
            { key: { economicalStatus: 1 }, name: "dreampartner_economic" },
        ]);
        // ── OTPs ───────────────────────────────────────────────────────────────────
        yield db.collection("otps").createIndexes([
            { key: { phone: 1 }, unique: true, name: "otps_phone" },
            { key: { expiresAt: 1 }, expireAfterSeconds: 0, name: "otps_ttl" },
        ]);
        console.log("✅ All MongoDB indexes ensured");
    }
    catch (err) {
        // Index already exists error (code 86) ignore করো
        if ((err === null || err === void 0 ? void 0 : err.code) === 86 || (err === null || err === void 0 ? void 0 : err.codeName) === "IndexKeySpecsConflict") {
            console.log("✅ Indexes already exist");
            return;
        }
        console.error("❌ Index error:", err);
    }
});
exports.ensureIndexes = ensureIndexes;
