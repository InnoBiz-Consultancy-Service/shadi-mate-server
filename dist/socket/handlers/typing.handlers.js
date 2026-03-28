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
exports.typingHandler = void 0;
const redis_1 = require("../../utils/redis");
const typingHandler = (io, socket) => {
    socket.on("typing", (_a) => __awaiter(void 0, [_a], void 0, function* ({ toUserId }) {
        const senderId = socket.data.userId;
        if (!senderId || !toUserId)
            return;
        const receiverSocketId = yield redis_1.redisClient.hget("onlineUsers", toUserId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("typing", { fromUserId: senderId });
        }
    }));
    socket.on("stop-typing", (_a) => __awaiter(void 0, [_a], void 0, function* ({ toUserId }) {
        const senderId = socket.data.userId;
        if (!senderId || !toUserId)
            return;
        const receiverSocketId = yield redis_1.redisClient.hget("onlineUsers", toUserId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("stop-typing", { fromUserId: senderId });
        }
    }));
};
exports.typingHandler = typingHandler;
