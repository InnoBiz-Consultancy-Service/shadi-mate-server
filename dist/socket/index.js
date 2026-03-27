"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = void 0;
const presence_handlers_1 = require("./handlers/presence.handlers");
const chat_handlers_1 = require("./handlers/chat.handlers");
const typing_handlers_1 = require("./handlers/typing.handlers");
const seen_handlers_1 = require("./handlers/seen.handlers");
const initSocket = (io) => {
    io.on("connection", (socket) => {
        console.log("🔥 User connected:", socket.id);
        (0, presence_handlers_1.presenceHandler)(socket);
        (0, chat_handlers_1.chatHandler)(io, socket);
        (0, typing_handlers_1.typingHandler)(io, socket);
        (0, seen_handlers_1.seenHandler)(io, socket);
    });
};
exports.initSocket = initSocket;
