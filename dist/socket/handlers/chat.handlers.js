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
const chat_model_1 = require("../../app/modules/chat/chat.model");
const chatHandler = (io, socket) => {
    socket.on("send-message", (data) => __awaiter(void 0, void 0, void 0, function* () {
        const senderId = socket.data.userId;
        const subscription = socket.data.subscription;
        if (!senderId) {
            socket.emit("error", { message: "Unauthorized" });
            return;
        }
        if (subscription !== "premium") {
            socket.emit("error", {
                message: "Upgrade to premium to send messages",
                code: "SUBSCRIPTION_REQUIRED",
            });
            return;
        }
        const { receiverId, message, type = "text" } = data;
        if (!receiverId || !message) {
            socket.emit("error", { message: "receiverId and message are required" });
            return;
        }
        const savedMessage = yield chat_model_1.Message.create({
            senderId,
            receiverId,
            content: message,
            type,
            status: "sent",
        });
        console.log(`💬 Message saved: ${senderId} → ${receiverId}`);
        const receiverSocketId = yield redis_1.redisClient.hget("onlineUsers", receiverId);
        if (receiverSocketId) {
            yield chat_model_1.Message.findByIdAndUpdate(savedMessage._id, { status: "delivered" });
            io.to(receiverSocketId).emit("receive-message", {
                _id: savedMessage._id,
                senderId,
                receiverId,
                message,
                type,
                status: "delivered",
                createdAt: savedMessage.createdAt,
            });
        }
        socket.emit("message-sent", {
            _id: savedMessage._id,
            senderId,
            receiverId,
            message,
            type,
            status: receiverSocketId ? "delivered" : "sent",
            createdAt: savedMessage.createdAt,
        });
    }));
};
exports.chatHandler = chatHandler;
