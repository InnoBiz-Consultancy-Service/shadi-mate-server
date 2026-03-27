import { Socket } from "socket.io";
import { redisClient } from "../../utils/redis";
import { Message } from "../../app/modules/chat/chat.model";

export const chatHandler = (io: any, socket: Socket) => {
    socket.on("send-message", async (data) => {
        const senderId = socket.data.userId;

        if (!senderId) {
            socket.emit("error", { message: "Unauthorized" });
            return;
        }

        const { receiverId, message, type = "text" } = data;

        if (!receiverId || !message) {
            socket.emit("error", { message: "receiverId and message are required" });
            return;
        }

        const savedMessage = await Message.create({
            senderId,
            receiverId,
            content: message,
            type,
            status: "sent",
        });

        console.log(`💬 Message saved: ${senderId} → ${receiverId}`);

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