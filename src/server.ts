/* eslint-disable no-console */
import { Server } from "http";
import mongoose from "mongoose";
import app from "./app";
import { envVars } from "./config/envConfig";

import { seedSuperAdmin } from "./utils/seedSuperAdmin";
import { seedGeoData } from "./utils/seedGeoData";
import { seedPersonalityQuestions } from "./utils/seedPersonalityQuestions";

import http from "http";
import { Server as SocketIOServer, Socket } from "socket.io";

let server: Server;


const onlineUsers = new Map<string, string>(); 

const startServer = async () => {
    try {
        // ✅ DB Connect
        await mongoose.connect(envVars.DB_URL);
        console.log("✅ Connected to DB!");

        // ✅ Create HTTP server
        const httpServer = http.createServer(app);

        // ✅ Setup Socket.IO
        const io = new SocketIOServer(httpServer, {
            cors: {
                origin: "https://shadimate-client.vercel.app",
                credentials: true,
            },
        });

        // ✅ Socket connection handler
        io.on("connection", (socket: Socket) => {
            console.log("🔥 User connected:", socket.id);

            /**
             * 🟢 Register user (important for chat)
             * frontend theke userId pathaba connect er por
             */
            socket.on("register", (userId: string) => {
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
        server = httpServer.listen(envVars.PORT, () => {
            console.log(`🚀 Server running on port ${envVars.PORT}`);
        });

    } catch (error) {
        console.log("❌ Server start error:", error);
    }
};

startServer();

// 🌱 Seeders
seedSuperAdmin();
seedGeoData();
seedPersonalityQuestions();

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