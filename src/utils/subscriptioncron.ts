import cron from "node-cron";
import { SubscriptionService } from "../app/modules/subscription/subscription.service";
import { Subscription } from "../app/modules/subscription/subscription.model";
import { User } from "../app/modules/user/user.model";
import { Notification } from "../app/modules/notification/notification.model";
import { getIO } from "../socket/handlers/socketSingleton";
import redisClient from "./redis";

// ─── Redis Key ────────────────────────────────────────────────────────────────
// প্রতিদিন একবারই notification যাবে — Redis দিয়ে track করবো

const REMINDER_KEY = (userId: string) => `sub:reminder:${userId}`;
const REMINDER_TTL = 60 * 60 * 25; // 25 ঘন্টা

// ─── Send Expiry Reminder Notification ───────────────────────────────────────
const sendExpiryReminder = async (
    userId: string,
    userName: string,
    daysLeft: number,
    endDate: Date
) => {
    try {
        const alreadySent = await redisClient.get(REMINDER_KEY(userId));
        if (alreadySent) {
            console.log(`⏭️ [Reminder] Already sent today for user: ${userId}`);
            return;
        }

        const message = daysLeft === 1
            ? `Your premium subscription (${endDate.toLocaleDateString("bn-BD")}) will expire tomorrow. Please renew it.`
            : `Your premium subscription will expire in ${daysLeft} days (${endDate.toLocaleDateString("bn-BD")}). Please renew it.`;

        // ─── DB তে notification save করো ──────────────────────────────────────
        const notification = await Notification.create({
            recipientId: userId,
            senderId:    userId,   
            type:        "new_message", 
            message,
            isRead:      false,
            metadata:    {
                type:    "subscription_expiry_reminder",
                daysLeft,
                endDate: endDate.toISOString(),
            },
        });

        // ─── Realtime Socket notification পাঠাও ──────────────────────────────
        try {
            const io = getIO();
            const receiverSocketId = await redisClient.hget("onlineUsers", userId);

            if (receiverSocketId) {
                io.to(String(receiverSocketId)).emit("new-notification", {
                    _id:      notification._id,
                    type:     "subscription_expiry_reminder",
                    message,
                    daysLeft,
                    endDate:  endDate.toISOString(),
                    isRead:   false,
                    createdAt: notification.createdAt,
                });
                console.log(`📲 [Reminder] Realtime sent to user: ${userId}`);
            } else {
                console.log(`📥 [Reminder] User offline, saved to DB: ${userId}`);
            }
        } catch (_) {
        }

        await redisClient.setex(REMINDER_KEY(userId), REMINDER_TTL, "1");

        console.log(`✅ [Reminder] Sent (${daysLeft} day${daysLeft > 1 ? "s" : ""} left): ${userName}`);

    } catch (err) {
        console.error(`❌ [Reminder] Error for user ${userId}:`, err);
    }
};

const runReminderJob = async () => {
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

    const expiringSubscriptions = await Subscription.find({
        status: "active",
        $or: [
            { endDate: { $gte: twoDaysStart, $lte: twoDaysLater } }, // ২ দিন বাকি
            { endDate: { $gte: oneDayStart, $lte: oneDayLater } },   // ১ দিন বাকি
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
        const user = sub.userId as any;
        if (!user?._id) continue;

        const endDate = new Date(sub.endDate);
        const msLeft = endDate.getTime() - now.getTime();
        const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

        await sendExpiryReminder(
            user._id.toString(),
            user.name ?? "User",
            daysLeft,
            endDate
        );
    }

    console.log("✅ [Reminder] Job completed");
};

// ─── Expiry Job: প্রতিদিন রাত ১২:০১ তে ─────────────────────────────────────
const runExpiryJob = async () => {
    console.log("⏰ [Cron] Running subscription expiry check...");
    try {
        await SubscriptionService.expireSubscriptions();
    } catch (err) {
        console.error("❌ [Cron] Subscription expiry error:", err);
    }
};

// ─── Start All Cron Jobs ──────────────────────────────────────────────────────
export const startSubscriptionCron = () => {
    // রাত ১২:০১ — expire check
    cron.schedule("1 0 * * *", runExpiryJob);

    // সকাল ১০:০০ — reminder notification
    cron.schedule("0 10 * * *", runReminderJob);

    console.log("✅ Subscription crons started:");
    console.log("   ├─ Expiry check:  daily at 00:01");
    console.log("   └─ Reminder:      daily at 10:00");
};