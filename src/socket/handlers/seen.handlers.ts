import { Socket } from "socket.io";
import { Types } from "mongoose";
import { Message, Conversation } from "../../app/modules/chat/chat.model";
import redisClient from "../../utils/redis";

export const seenHandler = (io: any, socket: Socket) => {
    socket.on("seen", async ({ messageId }: { messageId: string }) => {

        const viewerId = socket.data.userId;

        if (!messageId || !viewerId) return;

        if (!Types.ObjectId.isValid(messageId)) return;

        const msg = await Message.findById(messageId).select("senderId receiverId status").lean();

        if (!msg) return;

        if (msg.receiverId.toString() !== viewerId) return;

        if (msg.status === "seen") return;

        const senderId   = msg.senderId.toString();
        const receiverId = viewerId;

        await Message.updateMany(
            {
                senderId:   msg.senderId,
                receiverId: new Types.ObjectId(receiverId),
                status:     { $ne: "seen" },
            },
            { status: "seen" }
        );

        const participantKey = [senderId, receiverId].sort().join("_");

        await Conversation.updateOne(
            { participantKey },
            {
                $set: {
                    ...(msg.senderId.toString() === senderId && {
                        lastMessageStatus: "seen",
                    }),
                    [`unreadCounts.${receiverId}`]: 0,
                },
            }
        );

        // FIX: hget → hGet (node-redis v4)
        const senderSocketId = await redisClient.hGet("onlineUsers", senderId);

        if (senderSocketId) {
            io.to(String(senderSocketId)).emit("message-seen", {
                messageId,
                conversationWith: receiverId,
            });
        }
    });
};