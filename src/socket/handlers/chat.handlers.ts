import { Socket } from "socket.io";
import { Message, Conversation } from "../../app/modules/chat/chat.model";
import { User } from "../../app/modules/user/user.model";
import { NotificationService } from "../../app/modules/notification/notification.service";
import { IgnoreService } from "../../app/modules/ignore/ignore.service";
import { getIO } from "./socketSingleton";
import redisClient from "../../utils/redis";

const makeParticipantKey = (a: string, b: string): string => {
    return [a, b].sort().join("_");
};

export const chatHandler = (socket: Socket) => {
    socket.on("send-message", async (data) => {
        const senderId     = socket.data.userId;
        const subscription = socket.data.subscription;
        console.log("📨 send-message received:", { senderId, subscription, data });

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

        if (senderId === receiverId) {
            socket.emit("error", { message: "Cannot send message to yourself" });
            return;
        }

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

        const io = getIO();
        // FIX: hget → hGet (node-redis v4)
        const receiverSocketId = await redisClient.hGet("onlineUsers", receiverId);
        let finalStatus = "sent";

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

        // ─── Conversation upsert ──────────────────────────────────────────────
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
                    [`unreadCounts.${senderId}`]: 0,
                },
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