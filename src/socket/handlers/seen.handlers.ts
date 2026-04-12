import { Socket } from "socket.io";
import { Types } from "mongoose";
import { Message, Conversation } from "../../app/modules/chat/chat.model";
import redisClient from "../../utils/redis";

export const seenHandler = (io: any, socket: Socket) => {
    socket.on("seen", async ({ messageId }: { messageId: string }) => {
    
        const viewerId = socket.data.userId;

        if (!messageId || !viewerId) return;

        // ── Bug 2 fix: ObjectId validate আগে ─────────────────────────────────
        if (!Types.ObjectId.isValid(messageId)) return;

        // ── messageId দিয়ে actual message তুলে senderId/receiverId নাও ────────
        // শুধু এই message-এর sender কে notify করা যাবে
        const msg = await Message.findById(messageId).select("senderId receiverId status").lean();

        if (!msg) return;

        // viewerId হতে হবে receiver — নিজের পাঠানো message নিজে seen করা যাবে না
        if (msg.receiverId.toString() !== viewerId) return;

        // ইতিমধ্যে seen হলে কিছু করার নেই
        if (msg.status === "seen") return;

        const senderId   = msg.senderId.toString();
        const receiverId = viewerId;

        // ── Bug 3 fix: শুধু একটা message নয়, এই conversation-এর সব ──────────
        // আগে: findByIdAndUpdate — শুধু ওই একটা message seen হতো
        // ফলে আগের unread message গুলো "delivered" থেকে যেত
        // Fix: এই sender থেকে receiver-এর সব unread message একসাথে seen করো
        await Message.updateMany(
            {
                senderId:   msg.senderId,
                receiverId: new Types.ObjectId(receiverId),
                status:     { $ne: "seen" },
            },
            { status: "seen" }
        );

        // ── Bug 4 fix: Conversation.lastMessageStatus update ──────────────────
        // আগে: Conversation document-এ status কখনো "seen" হতো না
        // Frontend সবসময় "delivered" দেখাতো double tick দিয়ে
        // Fix: last message এই sender-এর হলে status "seen" করো
        // + receiver-এর unread count 0 করো
        const participantKey = [senderId, receiverId].sort().join("_");

        await Conversation.updateOne(
            { participantKey },
            {
                $set: {
                    // lastMessageSenderId এই sender হলেই "seen" করো
                    // অন্যথায় sender অন্যজন — status পরিবর্তন করা উচিত না
                    ...(msg.senderId.toString() === senderId && {
                        lastMessageStatus: "seen",
                    }),
                    [`unreadCounts.${receiverId}`]: 0,
                },
            }
        );

        // ── Bug 5 fix: sender কে notify করো authenticated senderId দিয়ে ──────
        const senderSocketId = await redisClient.hget("onlineUsers", senderId);

        if (senderSocketId) {
            io.to(String(senderSocketId)).emit("message-seen", {
                messageId,           // কোন message seen হয়েছে
                conversationWith: receiverId,  // কার সাথে conversation
            });
        }
    });
};