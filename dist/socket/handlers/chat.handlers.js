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
exports.chatHandler = void 0;
const redis_1 = require("../../utils/redis");
const chatHandler = (io, socket) => {
    socket.on("send-message", (data) => __awaiter(void 0, void 0, void 0, function* () {
        const senderId = socket.data.userId;
        if (!senderId)
            return;
        const { receiverId, message } = data;
        const receiverSocketId = yield redis_1.redisClient.hget("onlineUsers", receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("receive-message", { senderId, message });
        }
        console.log("💬 Message:", { senderId, receiverId, message });
    }));
};
exports.chatHandler = chatHandler;
