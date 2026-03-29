import { Socket } from "socket.io";
import { redisClient } from "../../utils/redis";
import { Message } from "../../app/modules/chat/chat.model";
import { User } from "../../app/modules/user/user.model";
import { NotificationService } from "../../app/modules/notification/notification.service";
import { getIO } from "./socketSingleton";

export const chatHandler = (socket: Socket) => {
    socket.on("send-message", async (data) => {
        const senderId = socket.data.userId;
        const subscription = socket.data.subscription;

        if (!senderId) {
            socket.emit("error", { message: "Unauthorized" });
            return;
        }

        // 🔒 Free user send করতে পারবে না
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

        // ─── Message save ─────────────────────────────────────────────────────
        const savedMessage = await Message.create({
            senderId,
            receiverId,
            content: message,
            type,
            status: "sent",
        });

        console.log(`💬 Message saved: ${senderId} → ${receiverId}`);

        const io = getIO();
        const receiverSocketId = await redisClient.hget("onlineUsers", receiverId);

        if (receiverSocketId) {
            await Message.findByIdAndUpdate(savedMessage._id, { status: "delivered" });

            io.to(receiverSocketId).emit("receive-message", {
                _id: savedMessage._id,
                senderId,
                receiverId,
                message,
                type,
                status: "delivered",
                createdAt: savedMessage.createdAt,
            });
        }

        // ─── Message notification ─────────────────────────────────────────────
        try {
            const sender = await User.findById(senderId).select("name").lean();
            const senderName = sender?.name ?? "Someone";

            await NotificationService.createAndDeliver({
                io,
                redisClient,
                recipientId: receiverId,
                senderId,
                senderName,
                type: "new_message",
                metadata: {
                    messageId: savedMessage._id.toString(),
                    conversationWith: senderId,
                },
            });
        } catch (err) {
            console.error("❌ Message notification error:", err);
        }

        // ─── Sender confirm ───────────────────────────────────────────────────
        socket.emit("message-sent", {
            _id: savedMessage._id,
            senderId,
            receiverId,
            message,
            type,
            status: receiverSocketId ? "delivered" : "sent",
            createdAt: savedMessage.createdAt,
        });
    });
};