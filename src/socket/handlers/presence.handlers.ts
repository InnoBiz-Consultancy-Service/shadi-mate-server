import { Socket } from "socket.io";
import { verifyToken } from "../../utils/socket.auth";
import redisClient from "../../utils/redis";
import { getIO } from "./socketSingleton";

export const presenceHandler = (socket: Socket) => {
    const raw = socket.handshake.query.token as string;

    if (!raw) {
        socket.emit("unauthorized", { message: "No token provided" });
        socket.disconnect();
        return;
    }

    const token = raw.startsWith("Bearer ") ? raw.slice(7) : raw;
    const decoded = verifyToken(token);

    if (!decoded) {
        socket.emit("unauthorized", { message: "Invalid or expired token" });
        socket.disconnect();
        return;
    }

    socket.data.userId = decoded.id;
    socket.data.subscription = decoded.subscription ?? "free";

    redisClient.hSet("onlineUsers", decoded.id, socket.id);
    console.log(`🟢 User ${decoded.id} is online (subscription: ${socket.data.subscription})`);

    // ✅ সব online user কে জানাও এই user online হয়েছে
    socket.broadcast.emit("user-online", decoded.id);

    // ✅ এই user কে জানাও কোন কোন user এখন online আছে
    redisClient.hGetAll("onlineUsers").then((onlineUsers) => {
        const onlineUserIds = Object.keys(onlineUsers).filter(
            (id) => id !== decoded.id
        );
        socket.emit("online-users", onlineUserIds);
    });

    socket.on("disconnect", async () => {
        const current = await redisClient.hGet("onlineUsers", decoded.id);
        if (current === socket.id) {
            await redisClient.hDel("onlineUsers", decoded.id);

            // ✅ সব user কে জানাও এই user offline হয়েছে
            const io = getIO();
            io.emit("user-offline", {
                userId: decoded.id,
                lastSeen: new Date().toISOString(),
            });
        }
        console.log(`🔴 User ${decoded.id} offline`);
    });
};