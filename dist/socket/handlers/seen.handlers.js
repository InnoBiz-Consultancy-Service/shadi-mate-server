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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seenHandler = void 0;
const mongoose_1 = require("mongoose");
const chat_model_1 = require("../../app/modules/chat/chat.model");
const redis_1 = __importDefault(require("../../utils/redis"));
const seenHandler = (io, socket) => {
    socket.on("seen", (_a) => __awaiter(void 0, [_a], void 0, function* ({ messageId }) {
        const viewerId = socket.data.userId;
        if (!messageId || !viewerId)
            return;
        // ── Bug 2 fix: ObjectId validate আগে ─────────────────────────────────
        if (!mongoose_1.Types.ObjectId.isValid(messageId))
            return;
        // ── messageId দিয়ে actual message তুলে senderId/receiverId নাও ────────
        // শুধু এই message-এর sender কে notify করা যাবে
        const msg = yield chat_model_1.Message.findById(messageId).select("senderId receiverId status").lean();
        if (!msg)
            return;
        // viewerId হতে হবে receiver — নিজের পাঠানো message নিজে seen করা যাবে না
        if (msg.receiverId.toString() !== viewerId)
            return;
        // ইতিমধ্যে seen হলে কিছু করার নেই
        if (msg.status === "seen")
            return;
        const senderId = msg.senderId.toString();
        const receiverId = viewerId;
        // ── Bug 3 fix: শুধু একটা message নয়, এই conversation-এর সব ──────────
        // আগে: findByIdAndUpdate — শুধু ওই একটা message seen হতো
        // ফলে আগের unread message গুলো "delivered" থেকে যেত
        // Fix: এই sender থেকে receiver-এর সব unread message একসাথে seen করো
        yield chat_model_1.Message.updateMany({
            senderId: msg.senderId,
            receiverId: new mongoose_1.Types.ObjectId(receiverId),
            status: { $ne: "seen" },
        }, { status: "seen" });
        // ── Bug 4 fix: Conversation.lastMessageStatus update ──────────────────
        // আগে: Conversation document-এ status কখনো "seen" হতো না
        // Frontend সবসময় "delivered" দেখাতো double tick দিয়ে
        // Fix: last message এই sender-এর হলে status "seen" করো
        // + receiver-এর unread count 0 করো
        const participantKey = [senderId, receiverId].sort().join("_");
        yield chat_model_1.Conversation.updateOne({ participantKey }, {
            $set: Object.assign(Object.assign({}, (msg.senderId.toString() === senderId && {
                lastMessageStatus: "seen",
            })), { [`unreadCounts.${receiverId}`]: 0 }),
        });
        // ── Bug 5 fix: sender কে notify করো authenticated senderId দিয়ে ──────
        const senderSocketId = yield redis_1.default.hget("onlineUsers", senderId);
        if (senderSocketId) {
            io.to(String(senderSocketId)).emit("message-seen", {
                messageId, // কোন message seen হয়েছে
                conversationWith: receiverId, // কার সাথে conversation
            });
        }
    }));
};
exports.seenHandler = seenHandler;
