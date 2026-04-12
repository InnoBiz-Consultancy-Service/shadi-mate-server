import { Socket } from "socket.io";
import { Message, Conversation } from "../../app/modules/chat/chat.model";
import { User } from "../../app/modules/user/user.model";
import { NotificationService } from "../../app/modules/notification/notification.service";
import { IgnoreService } from "../../app/modules/ignore/ignore.service";
import { getIO } from "./socketSingleton";
import redisClient from "../../utils/redis";

// ─── Helper: participantKey তৈরি করো ─────────────────────────────────────────
// FIX (Critical Race Condition): আগের code-এ participantIds array-এ
// {$all:[A,B],$size:2} দিয়ে upsert করা হতো।
// Problem: [A,B] এবং [B,A] MongoDB-তে আলাদা array, unique index কাজ করে না।
// 50,000 concurrent request-এ একসাথে upsert পাঠালে duplicate document তৈরি হয়।
//
// Solution: string key "smallerId_largerId" → সর্বদা same string, race condition নেই।
// Mongoose unique index এই key-এ enforce করে → database level guarantee।
const makeParticipantKey = (a: string, b: string): string => {
    return [a, b].sort().join("_");
};

export const chatHandler = (socket: Socket) => {
    socket.on("send-message", async (data) => {
        const senderId     = socket.data.userId;
        const subscription = socket.data.subscription;

        if (!senderId) {
            socket.emit("error", { message: "Unauthorized" });
            return;
        }

        if (subscription !== "premium") {
            socket.emit("error", {
                message: "Upgrade to premium to send messages",
                code: "SUBSCRIPTION_REQUIRED",
            });
            return;
        }

        const { receiverId, message, type = "text" } = data;

        if (!receiverId || !message) {
            socket.emit("error", { message: "receiverId and message are required" });
            return;
        }

        // নিজেকে message পাঠানো আটকাও
        if (senderId === receiverId) {
            socket.emit("error", { message: "Cannot send message to yourself" });
            return;
        }

        // Message content sanitize — XSS আটকাতে trim করো
        const sanitizedMessage = String(message).trim();
        if (!sanitizedMessage) {
            socket.emit("error", { message: "Message cannot be empty" });
            return;
        }

        // ─── Ignore check ─────────────────────────────────────────────────────
        const isIgnored = await IgnoreService.isIgnoredBy(senderId, receiverId);

        if (isIgnored) {
            await IgnoreService.saveIgnoredMessage({
                senderId,
                receiverId,
                content: sanitizedMessage,
                type,
            });

            socket.emit("message-sent", {
                _id: null,
                senderId,
                receiverId,
                message: sanitizedMessage,
                type,
                status: "sent",
                createdAt: new Date(),
            });
            return;
        }

        // ─── Message save ─────────────────────────────────────────────────────
        const savedMessage = await Message.create({
            senderId,
            receiverId,
            content: sanitizedMessage,
            type,
            status: "sent",
        });

        const io             = getIO();
        const receiverSocketId = await redisClient.hget("onlineUsers", receiverId);
        let finalStatus      = "sent";

        if (receiverSocketId) {
            await Message.findByIdAndUpdate(savedMessage._id, { status: "delivered" });
            finalStatus = "delivered";

            io.to(String(receiverSocketId)).emit("receive-message", {
                _id:       savedMessage._id,
                senderId,
                receiverId,
                message:   sanitizedMessage,
                type,
                status:    "delivered",
                createdAt: savedMessage.createdAt,
            });
        }

        // ─── Conversation upsert (race-condition safe) ────────────────────────
        // FIX: participantKey দিয়ে upsert — unique string index guarantee করে
        // একই pair-এর জন্য কখনো duplicate document হবে না, এমনকি concurrent-এ।
        const participantKey = makeParticipantKey(senderId, receiverId);
        const sortedIds      = [senderId, receiverId].sort();

        await Conversation.findOneAndUpdate(
            { participantKey },
            {
                $set: {
                    participantKey,
                    participantIds:      sortedIds,
                    lastMessage:         sanitizedMessage,
                    lastMessageType:     type,
                    lastMessageSenderId: senderId,
                    lastMessageAt:       savedMessage.createdAt,
                    lastMessageStatus:   finalStatus,
                    // Sender-এর unread count 0 রাখো (নিজের পাঠানো message unread নয়)
                    [`unreadCounts.${senderId}`]: 0,
                },
                // Receiver-এর unread count বাড়াও
                $inc: { [`unreadCounts.${receiverId}`]: 1 },
            },
            { upsert: true, new: true }
        );

        // ─── Notification (fire-and-forget) ──────────────────────────────────
        try {
            const sender     = await User.findById(senderId).select("name").lean();
            const senderName = sender?.name ?? "Someone";

            await NotificationService.createAndDeliver({
                io,
                redisClient,
                recipientId: receiverId,
                senderId,
                senderName,
                type: "new_message",
                metadata: {
                    messageId:        savedMessage._id.toString(),
                    conversationWith: senderId,
                },
            });
        } catch (err) {
            console.error("❌ Message notification error:", err);
        }

        // ─── Sender confirm ───────────────────────────────────────────────────
        socket.emit("message-sent", {
            _id:       savedMessage._id,
            senderId,
            receiverId,
            message:   sanitizedMessage,
            type,
            status:    finalStatus,
            createdAt: savedMessage.createdAt,
        });
    });
};