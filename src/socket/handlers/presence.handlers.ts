import { Socket } from "socket.io";
import { verifyToken } from "../../utils/socket.auth";
import redisClient from "../../utils/redis";

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
    socket.data.subscription = decoded.subscription ?? "free";

    // FIX: hset → hSet (node-redis v4)
    // Connect এর সময়ই set করো — পুরনো stale entry overwrite হবে
    redisClient.hSet("onlineUsers", decoded.id, socket.id);
    console.log(`🟢 User ${decoded.id} is online (subscription: ${socket.data.subscription})`);

    socket.on("disconnect", async () => {
        // FIX: hdel → hDel (node-redis v4)
        // শুধু এই socket এর entry মুছো — same user অন্য tab এ থাকলে সমস্যা নেই
        const current = await redisClient.hGet("onlineUsers", decoded.id);
        if (current === socket.id) {
            await redisClient.hDel("onlineUsers", decoded.id);
        }
        console.log(`🔴 User ${decoded.id} offline`);
    });
};