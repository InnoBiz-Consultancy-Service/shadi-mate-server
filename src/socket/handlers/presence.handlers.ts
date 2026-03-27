import { Socket } from "socket.io";
import { redisClient } from "../../utils/redis";
import { verifyToken } from "../../utils/socket.auth";
export const presenceHandler = (socket: Socket) => {
    socket.on("register", async (token: string) => {
        const decoded = verifyToken(token);
        if (!decoded) return socket.emit("unauthorized");

        const userId = decoded.id;
        socket.data.userId = userId;

        await redisClient.hset("onlineUsers", userId, socket.id);
        console.log(`🟢 User ${userId} is online`);
    });

    socket.on("disconnect", async () => {
        const userId = socket.data.userId;
        if (userId) {
            await redisClient.hdel("onlineUsers", userId);
            console.log(`🔴 User ${userId} offline`);
        }
    });
};