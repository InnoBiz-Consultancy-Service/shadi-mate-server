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
const user_model_1 = require("../../app/modules/user/user.model");
const notification_service_1 = require("../../app/modules/notification/notification.service");
const ignore_service_1 = require("../../app/modules/ignore/ignore.service");
const socketSingleton_1 = require("./socketSingleton");
const chatHandler = (socket) => {
    socket.on("send-message", (data) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
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
        const isIgnored = yield ignore_service_1.IgnoreService.isIgnoredBy(senderId, receiverId);
        if (isIgnored) {
            yield ignore_service_1.IgnoreService.saveIgnoredMessage({
                senderId,
                receiverId,
                content: message,
                type,
            });
            socket.emit("message-sent", {
                _id: null,
                senderId,
                receiverId,
                message,
                type,
                status: "sent",
                createdAt: new Date(),
            });
            return;
        }
        // ─── Normal Message save ──────────────────────────────────────────────
        const savedMessage = yield chat_model_1.Message.create({
            senderId,
            receiverId,
            content: message,
            type,
            status: "sent",
        });
        console.log(`💬 Message saved: ${senderId} → ${receiverId}`);
        const io = (0, socketSingleton_1.getIO)();
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
        // ─── Notification ─────────────────────────────────────────────────────
        try {
            const sender = yield user_model_1.User.findById(senderId).select("name").lean();
            const senderName = (_a = sender === null || sender === void 0 ? void 0 : sender.name) !== null && _a !== void 0 ? _a : "Someone";
            yield notification_service_1.NotificationService.createAndDeliver({
                io,
                redisClient: redis_1.redisClient,
                recipientId: receiverId,
                senderId,
                senderName,
                type: "new_message",
                metadata: {
                    messageId: savedMessage._id.toString(),
                    conversationWith: senderId,
                },
            });
        }
        catch (err) {
            console.error("❌ Message notification error:", err);
        }
        // ─── Sender confirm ───────────────────────────────────────────────────
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
