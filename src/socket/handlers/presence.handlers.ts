import { Socket } from "socket.io";
import { redisClient } from "../../utils/redis";
import { verifyToken } from "../../utils/socket.auth";

export const presenceHandler = (socket: Socket) => {
    const token = socket.handshake.query.token as string;

    if (!token) {
        socket.emit("unauthorized", { message: "No token provided" });
        socket.disconnect();
        return;
    }

    const decoded = verifyToken(token);

    if (!decoded) {
        socket.emit("unauthorized", { message: "Invalid or expired token" });
        socket.disconnect();
        return;
    }

    socket.data.userId = decoded.id;
    redisClient.hset("onlineUsers", decoded.id, socket.id);
    console.log(`🟢 User ${decoded.id} is online`);

    socket.on("disconnect", async () => {
        await redisClient.hdel("onlineUsers", decoded.id);
        console.log(`🔴 User ${decoded.id} offline`);
    });
};