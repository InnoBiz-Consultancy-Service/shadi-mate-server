"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seenHandler = void 0;
const chat_model_1 = require("../../app/modules/chat/chat.model");
const redis_1 = require("../../utils/redis");
const seenHandler = (io, socket) => {
    socket.on("seen", (_a) => __awaiter(void 0, [_a], void 0, function* ({ messageId, senderId }) {
        yield chat_model_1.Message.findByIdAndUpdate(messageId, {
            status: "seen",
        });
        const senderSocket = yield redis_1.redisClient.hget("onlineUsers", senderId);
        if (senderSocket) {
            io.to(senderSocket).emit("message-seen", { messageId });
        }
    }));
};
exports.seenHandler = seenHandler;
