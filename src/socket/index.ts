import { Server, Socket } from "socket.io";
import { presenceHandler } from "./handlers/presence.handlers";
import { chatHandler } from "./handlers/chat.handlers";
import { typingHandler } from "./handlers/typing.handlers";
import { seenHandler } from "./handlers/seen.handlers";
import { Notification } from "../app/modules/notification/notification.model";
import { setIO } from "./handlers/socketSingleton";

export const initSocket = (io: Server) => {
    setIO(io);

    io.on("connection", async (socket: Socket) => {
        console.log("🔥 User connected:", socket.id);

        presenceHandler(socket);
        chatHandler(socket);
        typingHandler(io, socket);
        seenHandler(io, socket);

        // ─── Pending notifications deliver ────────────────────────────────────
        const userId = socket.handshake.query.userId as string;

        if (userId) {
            try {
                const pendingNotifications = await Notification.find({
                    recipientId: userId,
                    isRead: false,
                })
                    .sort({ createdAt: -1 })
                    .limit(50)
                    .populate("senderId", "name")
                    .lean();

                if (pendingNotifications.length > 0) {
                    socket.emit("pending-notifications", pendingNotifications);
                    console.log(`📬 Sent ${pendingNotifications.length} pending notifications to ${userId}`);
                }
            } catch (err) {
                console.error("❌ Error fetching pending notifications:", err);
            }
        }
    });
};