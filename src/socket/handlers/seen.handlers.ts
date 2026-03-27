import { Message } from "../../app/modules/chat/chat.model";
import { redisClient } from "../../utils/redis";
export const seenHandler = (io: any, socket: any) => {

  socket.on("seen", async ({ messageId, senderId }: { messageId: string; senderId: string }) => {

    await Message.findByIdAndUpdate(messageId, {
      status: "seen",
    });

    const senderSocket = await redisClient.hget("onlineUsers", senderId);

    if (senderSocket) {
      io.to(senderSocket).emit("message-seen", { messageId });
    }
  });
};