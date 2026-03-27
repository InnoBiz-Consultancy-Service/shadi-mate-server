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
exports.presenceHandler = void 0;
const redis_1 = require("../../utils/redis");
const socket_auth_1 = require("../../utils/socket.auth");
const presenceHandler = (socket) => {
    socket.on("register", (token) => __awaiter(void 0, void 0, void 0, function* () {
        const decoded = (0, socket_auth_1.verifyToken)(token);
        if (!decoded)
            return socket.emit("unauthorized");
        const userId = decoded.id;
        socket.data.userId = userId;
        yield redis_1.redisClient.hset("onlineUsers", userId, socket.id);
        console.log(`🟢 User ${userId} is online`);
    }));
    socket.on("disconnect", () => __awaiter(void 0, void 0, void 0, function* () {
        const userId = socket.data.userId;
        if (userId) {
            yield redis_1.redisClient.hdel("onlineUsers", userId);
            console.log(`🔴 User ${userId} offline`);
        }
    }));
};
exports.presenceHandler = presenceHandler;
