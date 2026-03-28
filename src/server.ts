import http from "http";
import mongoose from "mongoose";
import { Server as SocketIOServer } from "socket.io";
import app from "./app";
import { envVars } from "./config/envConfig";
import { initSocket } from "./socket";
import { connectRedis } from "./utils/redis";

import { seedSuperAdmin } from "./seeders/seedSuperAdmin";
import { seedGeoData } from "./seeders/seedGeoData";
import { seedPersonalityQuestions } from "./seeders/seedPersonalityQuestions";

const startServer = async () => {
    try {
        await mongoose.connect(envVars.DB_URL);
        console.log("✅ Connected to MongoDB");

        await connectRedis();

        const httpServer = http.createServer(app);
        const io = new SocketIOServer(httpServer, {
            cors: { origin: envVars.FRONTEND_URL, credentials: true },
        });

        initSocket(io);

        httpServer.listen(envVars.PORT, () => {
            console.log(`🚀 Server running on port ${envVars.PORT}`);
        });

        seedSuperAdmin();
        seedGeoData();
        seedPersonalityQuestions();

    } catch (err) {
        console.error("❌ Server error:", err);
        process.exit(1);
    }
};

process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));
process.on("unhandledRejection", (err) => console.error(err));
process.on("uncaughtException", (err) => console.error(err));

startServer();