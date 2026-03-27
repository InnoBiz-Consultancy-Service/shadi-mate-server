import { Socket } from "socket.io";
import { redisClient } from "../../utils/redis";

export const chatHandler = (io: any, socket: Socket) => {
    socket.on("send-message", async (data) => {
        const senderId = socket.data.userId;
        if (!senderId) return;

        const { receiverId, message } = data;
        const receiverSocketId = await redisClient.hget("onlineUsers", receiverId);

        if (receiverSocketId) {
            io.to(receiverSocketId).emit("receive-message", { senderId, message });
        }

        console.log("💬 Message:", { senderId, receiverId, message });
    });
};