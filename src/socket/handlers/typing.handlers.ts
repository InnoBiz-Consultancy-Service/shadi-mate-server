import { Socket } from "socket.io";
import redisClient from "../../utils/redis";

export const typingHandler = (io: any, socket: Socket) => {
    socket.on("typing", async ({ toUserId }: { toUserId: string }) => {
        const senderId = socket.data.userId;
        if (!senderId || !toUserId) return;

        const receiverSocketId = await redisClient.hget("onlineUsers", toUserId);

        if (receiverSocketId) {
            io.to(String(receiverSocketId)).emit("typing", { fromUserId: senderId });
        }
    });

    socket.on("stop-typing", async ({ toUserId }: { toUserId: string }) => {
        const senderId = socket.data.userId;
        if (!senderId || !toUserId) return;

        const receiverSocketId = await redisClient.hget("onlineUsers", toUserId);

        if (receiverSocketId) {
            io.to(receiverSocketId).emit("stop-typing", { fromUserId: senderId });
        }
    });
};