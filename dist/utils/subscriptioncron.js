"use strict";
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
exports.startSubscriptionCron = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const subscription_service_1 = require("../app/modules/subscription/subscription.service");
const subscription_model_1 = require("../app/modules/subscription/subscription.model");
const notification_model_1 = require("../app/modules/notification/notification.model");
const socketSingleton_1 = require("../socket/handlers/socketSingleton");
const redis_1 = __importDefault(require("./redis"));
// ─── Redis Key ────────────────────────────────────────────────────────────────
// প্রতিদিন একবারই notification যাবে — Redis দিয়ে track করবো
const REMINDER_KEY = (userId) => `sub:reminder:${userId}`;
const REMINDER_TTL = 60 * 60 * 25; // 25 ঘন্টা
// ─── Send Expiry Reminder Notification ───────────────────────────────────────
const sendExpiryReminder = (userId, userName, daysLeft, endDate) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const alreadySent = yield redis_1.default.get(REMINDER_KEY(userId));
        if (alreadySent) {
            console.log(`⏭️ [Reminder] Already sent today for user: ${userId}`);
            return;
        }
        const message = daysLeft === 1
            ? `Your premium subscription (${endDate.toLocaleDateString("bn-BD")}) will expire tomorrow. Please renew it.`
            : `Your premium subscription will expire in ${daysLeft} days (${endDate.toLocaleDateString("bn-BD")}). Please renew it.`;
        // ─── DB তে notification save করো ──────────────────────────────────────
        const notification = yield notification_model_1.Notification.create({
            recipientId: userId,
            senderId: userId,
            type: "new_message",
            message,
            isRead: false,
            metadata: {
                type: "subscription_expiry_reminder",
                daysLeft,
                endDate: endDate.toISOString(),
            },
        });
        // ─── Realtime Socket notification পাঠাও ──────────────────────────────
        try {
            const io = (0, socketSingleton_1.getIO)();
            const receiverSocketId = yield redis_1.default.hget("onlineUsers", userId);
            if (receiverSocketId) {
                io.to(String(receiverSocketId)).emit("new-notification", {
                    _id: notification._id,
                    type: "subscription_expiry_reminder",
                    message,
                    daysLeft,
                    endDate: endDate.toISOString(),
                    isRead: false,
                    createdAt: notification.createdAt,
                });
                console.log(`📲 [Reminder] Realtime sent to user: ${userId}`);
            }
            else {
                console.log(`📥 [Reminder] User offline, saved to DB: ${userId}`);
            }
        }
        catch (_) {
        }
        yield redis_1.default.setex(REMINDER_KEY(userId), REMINDER_TTL, "1");
        console.log(`✅ [Reminder] Sent (${daysLeft} day${daysLeft > 1 ? "s" : ""} left): ${userName}`);
    }
    catch (err) {
        console.error(`❌ [Reminder] Error for user ${userId}:`, err);
    }
});
const runReminderJob = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("🔔 [Cron] Running subscription expiry reminder check...");
    const now = new Date();
    const twoDaysLater = new Date(now);
    twoDaysLater.setDate(twoDaysLater.getDate() + 2);
    twoDaysLater.setHours(23, 59, 59, 999);
    const twoDaysStart = new Date(now);
    twoDaysStart.setDate(twoDaysStart.getDate() + 2);
    twoDaysStart.setHours(0, 0, 0, 0);
    const oneDayLater = new Date(now);
    oneDayLater.setDate(oneDayLater.getDate() + 1);
    oneDayLater.setHours(23, 59, 59, 999);
    const oneDayStart = new Date(now);
    oneDayStart.setDate(oneDayStart.getDate() + 1);
    oneDayStart.setHours(0, 0, 0, 0);
    const expiringSubscriptions = yield subscription_model_1.Subscription.find({
        status: "active",
        $or: [
            { endDate: { $gte: twoDaysStart, $lte: twoDaysLater } }, // ২ দিন বাকি
            { endDate: { $gte: oneDayStart, $lte: oneDayLater } }, // ১ দিন বাকি
        ],
    })
        .populate("userId", "name _id")
        .lean();
    if (!expiringSubscriptions.length) {
        console.log("✅ [Reminder] No subscriptions expiring in 1-2 days");
        return;
    }
    console.log(`📋 [Reminder] Found ${expiringSubscriptions.length} subscription(s) to remind`);
    for (const sub of expiringSubscriptions) {
        const user = sub.userId;
        if (!(user === null || user === void 0 ? void 0 : user._id))
            continue;
        const endDate = new Date(sub.endDate);
        const msLeft = endDate.getTime() - now.getTime();
        const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
        yield sendExpiryReminder(user._id.toString(), (_a = user.name) !== null && _a !== void 0 ? _a : "User", daysLeft, endDate);
    }
    console.log("✅ [Reminder] Job completed");
});
// ─── Expiry Job: প্রতিদিন রাত ১২:০১ তে ─────────────────────────────────────
const runExpiryJob = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("⏰ [Cron] Running subscription expiry check...");
    try {
        yield subscription_service_1.SubscriptionService.expireSubscriptions();
    }
    catch (err) {
        console.error("❌ [Cron] Subscription expiry error:", err);
    }
});
// ─── Start All Cron Jobs ──────────────────────────────────────────────────────
const startSubscriptionCron = () => {
    // রাত ১২:০১ — expire check
    node_cron_1.default.schedule("1 0 * * *", runExpiryJob);
    // সকাল ১০:০০ — reminder notification
    node_cron_1.default.schedule("0 10 * * *", runReminderJob);
    console.log("✅ Subscription crons started:");
    console.log("   ├─ Expiry check:  daily at 00:01");
    console.log("   └─ Reminder:      daily at 10:00");
};
exports.startSubscriptionCron = startSubscriptionCron;
