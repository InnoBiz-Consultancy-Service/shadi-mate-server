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
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("./app"));
const envConfig_1 = require("./config/envConfig");
const seedSuperAdmin_1 = require("./utils/seedSuperAdmin");
const seedGeoData_1 = require("./utils/seedGeoData");
const seedPersonalityQuestions_1 = require("./utils/seedPersonalityQuestions");
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
let server;
const onlineUsers = new Map();
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // ✅ DB Connect
        yield mongoose_1.default.connect(envConfig_1.envVars.DB_URL);
        console.log("✅ Connected to DB!");
        // ✅ Create HTTP server
        const httpServer = http_1.default.createServer(app_1.default);
        // ✅ Setup Socket.IO
        const io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: "https://shadimate-client.vercel.app",
                credentials: true,
            },
        });
        // ✅ Socket connection handler
        io.on("connection", (socket) => {
            console.log("🔥 User connected:", socket.id);
            /**
             * 🟢 Register user (important for chat)
             * frontend theke userId pathaba connect er por
             */
            socket.on("register", (userId) => {
                onlineUsers.set(userId, socket.id);
                console.log(`🟢 User ${userId} is online`);
            });
            /**
             * 🧪 Test event (ping-pong)
             */
            socket.on("ping", (data) => {
                console.log("📩 Ping received:", data);
                socket.emit("pong", {
                    message: "Server theke reply 🚀",
                });
            });
            /**
             * 💬 Send message (basic structure)
             */
            socket.on("send-message", (data) => {
                const { receiverId, message } = data;
                const receiverSocketId = onlineUsers.get(receiverId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("receive-message", {
                        senderId: data.senderId,
                        message,
                    });
                }
                console.log("💬 Message:", data);
            });
            /**
             * ⌨️ Typing indicator
             */
            socket.on("typing", ({ toUserId }) => {
                const receiverSocketId = onlineUsers.get(toUserId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("typing", {
                        from: socket.id,
                    });
                }
            });
            /**
             * ❌ Disconnect
             */
            socket.on("disconnect", () => {
                console.log("❌ User disconnected:", socket.id);
                // remove user from map
                for (const [userId, sId] of onlineUsers.entries()) {
                    if (sId === socket.id) {
                        onlineUsers.delete(userId);
                        console.log(`🔴 User ${userId} offline`);
                        break;
                    }
                }
            });
        });
        // ✅ Start server
        server = httpServer.listen(envConfig_1.envVars.PORT, () => {
            console.log(`🚀 Server running on port ${envConfig_1.envVars.PORT}`);
        });
    }
    catch (error) {
        console.log("❌ Server start error:", error);
    }
});
startServer();
// 🌱 Seeders
(0, seedSuperAdmin_1.seedSuperAdmin)();
(0, seedGeoData_1.seedGeoData)();
(0, seedPersonalityQuestions_1.seedPersonalityQuestions)();
// 🛑 Graceful shutdown handlers
process.on("SIGTERM", () => {
    console.log("⚠️ SIGTERM received... shutting down");
    if (server) {
        server.close(() => process.exit(1));
    }
});
process.on("SIGINT", () => {
    console.log("⚠️ SIGINT received... shutting down");
    if (server) {
        server.close(() => process.exit(1));
    }
});
process.on("unhandledRejection", (err) => {
    console.log("❌ Unhandled Rejection:", err);
    if (server) {
        server.close(() => process.exit(1));
    }
});
process.on("uncaughtException", (err) => {
    console.log("❌ Uncaught Exception:", err);
    if (server) {
        server.close(() => process.exit(1));
    }
});
