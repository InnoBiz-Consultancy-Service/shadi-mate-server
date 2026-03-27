import { Server, Socket } from "socket.io";
import { presenceHandler } from "./handlers/presence.handlers";
import { chatHandler } from "./handlers/chat.handlers";
import { typingHandler } from "./handlers/typing.handlers";
import { seenHandler } from "./handlers/seen.handlers";


export const initSocket = (io: Server) => {
    io.on("connection", (socket: Socket) => {
        console.log("🔥 User connected:", socket.id);

        presenceHandler(socket);
        chatHandler(io, socket);
        typingHandler(io, socket);
        seenHandler(io, socket);

       
    });
};