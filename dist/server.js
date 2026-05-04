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
// src/server.ts — FINAL with all optimizations
const http_1 = __importDefault(require("http"));
const mongoose_1 = __importDefault(require("mongoose"));
const socket_io_1 = require("socket.io");
const app_1 = __importDefault(require("./app"));
const envConfig_1 = require("./config/envConfig");
const socket_1 = require("./socket");
const redis_1 = require("./utils/redis");
const ensureIndexes_1 = require("./utils/ensureIndexes");
const seedSuperAdmin_1 = require("./seeders/seedSuperAdmin");
const seedGeoData_1 = require("./seeders/seedGeoData");
const seedPersonalityQuestions_1 = require("./seeders/seedPersonalityQuestions");
const subscriptioncron_1 = require("./utils/subscriptioncron");
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // CHANGE 1: maxPoolSize 200
        yield mongoose_1.default.connect(envConfig_1.envVars.DB_URL, {
            maxPoolSize: 200,
            minPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
            maxIdleTimeMS: 30000,
        });
        console.log("✅ Connected to MongoDB (maxPoolSize: 200)");
        yield (0, redis_1.connectRedis)();
        // CHANGE 5: indexes
        yield (0, ensureIndexes_1.ensureIndexes)();
        const httpServer = http_1.default.createServer(app_1.default);
        const io = new socket_io_1.Server(httpServer, {
            cors: { origin: envConfig_1.envVars.FRONTEND_URL, credentials: true },
            pingTimeout: 20000,
            pingInterval: 25000,
            transports: ["websocket", "polling"],
        });
        (0, socket_1.initSocket)(io);
        httpServer.listen(envConfig_1.envVars.PORT || 5000, () => {
            console.log(`🚀 Server running on port ${envConfig_1.envVars.PORT || 5000}`);
        });
        (0, seedSuperAdmin_1.seedSuperAdmin)();
        (0, seedGeoData_1.seedGeoData)();
        (0, seedPersonalityQuestions_1.seedPersonalityQuestions)();
        (0, subscriptioncron_1.startSubscriptionCron)();
    }
    catch (err) {
        console.error("❌ Server error:", err);
        process.exit(1);
    }
});
process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));
process.on("unhandledRejection", (err) => console.error(err));
process.on("uncaughtException", (err) => console.error(err));
startServer();
