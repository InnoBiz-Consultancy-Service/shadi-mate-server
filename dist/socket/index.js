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
exports.initSocket = void 0;
const presence_handlers_1 = require("./handlers/presence.handlers");
const chat_handlers_1 = require("./handlers/chat.handlers");
const typing_handlers_1 = require("./handlers/typing.handlers");
const seen_handlers_1 = require("./handlers/seen.handlers");
const notification_model_1 = require("../app/modules/notification/notification.model");
const socketSingleton_1 = require("./handlers/socketSingleton");
const initSocket = (io) => {
    (0, socketSingleton_1.setIO)(io);
    io.on("connection", (socket) => __awaiter(void 0, void 0, void 0, function* () {
        console.log("🔥 User connected:", socket.id);
        (0, presence_handlers_1.presenceHandler)(socket);
        (0, chat_handlers_1.chatHandler)(socket);
        (0, typing_handlers_1.typingHandler)(io, socket);
        (0, seen_handlers_1.seenHandler)(io, socket);
        // ─── Pending notifications deliver ────────────────────────────────────
        const userId = socket.handshake.query.userId;
        if (userId) {
            try {
                const pendingNotifications = yield notification_model_1.Notification.find({
                    recipientId: userId,
                    isRead: false,
                })
                    .sort({ createdAt: -1 })
                    .limit(50)
                    .populate("senderId", "name")
                    .lean();
                if (pendingNotifications.length > 0) {
                    socket.emit("pending-notifications", pendingNotifications);
                    console.log(`📬 Sent ${pendingNotifications.length} pending notifications to ${userId}`);
                }
            }
            catch (err) {
                console.error("❌ Error fetching pending notifications:", err);
            }
        }
    }));
};
exports.initSocket = initSocket;
