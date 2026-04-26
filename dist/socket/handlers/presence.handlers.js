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
exports.presenceHandler = void 0;
const socket_auth_1 = require("../../utils/socket.auth");
const redis_1 = __importDefault(require("../../utils/redis"));
const socketSingleton_1 = require("./socketSingleton");
const presenceHandler = (socket) => {
    var _a;
    const raw = socket.handshake.query.token;
    if (!raw) {
        socket.emit("unauthorized", { message: "No token provided" });
        socket.disconnect();
        return;
    }
    const token = raw.startsWith("Bearer ") ? raw.slice(7) : raw;
    const decoded = (0, socket_auth_1.verifyToken)(token);
    if (!decoded) {
        socket.emit("unauthorized", { message: "Invalid or expired token" });
        socket.disconnect();
        return;
    }
    socket.data.userId = decoded.id;
    socket.data.subscription = (_a = decoded.subscription) !== null && _a !== void 0 ? _a : "free";
    redis_1.default.hSet("onlineUsers", decoded.id, socket.id);
    console.log(`🟢 User ${decoded.id} is online (subscription: ${socket.data.subscription})`);
    // ✅ সব online user কে জানাও এই user online হয়েছে
    socket.broadcast.emit("user-online", decoded.id);
    // ✅ এই user কে জানাও কোন কোন user এখন online আছে
    redis_1.default.hGetAll("onlineUsers").then((onlineUsers) => {
        const onlineUserIds = Object.keys(onlineUsers).filter((id) => id !== decoded.id);
        socket.emit("online-users", onlineUserIds);
    });
    socket.on("disconnect", () => __awaiter(void 0, void 0, void 0, function* () {
        const current = yield redis_1.default.hGet("onlineUsers", decoded.id);
        if (current === socket.id) {
            yield redis_1.default.hDel("onlineUsers", decoded.id);
            // ✅ সব user কে জানাও এই user offline হয়েছে
            const io = (0, socketSingleton_1.getIO)();
            io.emit("user-offline", {
                userId: decoded.id,
                lastSeen: new Date().toISOString(),
            });
        }
        console.log(`🔴 User ${decoded.id} offline`);
    }));
};
exports.presenceHandler = presenceHandler;
