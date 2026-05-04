// src/server.ts — FINAL with all optimizations
import http from "http";
import mongoose from "mongoose";
import { Server as SocketIOServer } from "socket.io";
import app from "./app";
import { envVars }           from "./config/envConfig";
import { initSocket }        from "./socket";
import { connectRedis }      from "./utils/redis";
import { ensureIndexes }     from "./utils/ensureIndexes";

import { seedSuperAdmin }           from "./seeders/seedSuperAdmin";
import { seedGeoData }              from "./seeders/seedGeoData";
import { seedPersonalityQuestions } from "./seeders/seedPersonalityQuestions";
import { startSubscriptionCron }    from "./utils/subscriptioncron";

const startServer = async () => {
  try {
    // CHANGE 1: maxPoolSize 200
    await mongoose.connect(envVars.DB_URL, {
      maxPoolSize:              200,
      minPoolSize:              10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS:          45000,
      connectTimeoutMS:         10000,
      maxIdleTimeMS:            30000,
    });
    console.log("✅ Connected to MongoDB (maxPoolSize: 200)");

    await connectRedis();

    // CHANGE 5: indexes
    await ensureIndexes();

    const httpServer = http.createServer(app);
    const io = new SocketIOServer(httpServer, {
      cors:        { origin: envVars.FRONTEND_URL, credentials: true },
      pingTimeout: 20000,
      pingInterval: 25000,
      transports:  ["websocket", "polling"],
    });

    initSocket(io);

    httpServer.listen(envVars.PORT || 5000, () => {
      console.log(`🚀 Server running on port ${envVars.PORT || 5000}`);
    });

    seedSuperAdmin();
    seedGeoData();
    seedPersonalityQuestions();
    startSubscriptionCron();

  } catch (err) {
    console.error("❌ Server error:", err);
    process.exit(1);
  }
};

process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT",  () => process.exit(0));
process.on("unhandledRejection", (err) => console.error(err));
process.on("uncaughtException",  (err) => console.error(err));

startServer();
