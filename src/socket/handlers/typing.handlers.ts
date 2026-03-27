import { Socket } from "socket.io";
import { redisClient } from "../../utils/redis";

export const typingHandler = (io: any, socket: Socket) => {
    socket.on("typing", async ({ toUserId }) => {
        const senderId = socket.data.userId;
        const receiverSocketId = await redisClient.hget("onlineUsers", toUserId);

        if (receiverSocketId) {
            io.to(receiverSocketId).emit("typing", { fromUserId: senderId });
        }
    });
};