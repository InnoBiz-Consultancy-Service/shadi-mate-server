import { Socket } from "socket.io";
import { redisClient } from "../../utils/redis";
import { Message } from "../../app/modules/chat/chat.model";

export const seenHandler = (io: any, socket: Socket) => {
  socket.on("seen", async ({ messageId, senderId }: { messageId: string; senderId: string }) => {
    if (!messageId || !senderId) return;

    await Message.findByIdAndUpdate(messageId, { status: "seen" });

    const senderSocketId = await redisClient.hget("onlineUsers", senderId);

    if (senderSocketId) {
      io.to(senderSocketId).emit("message-seen", { messageId });
    }
  });
};