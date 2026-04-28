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
exports.sendCommand = exports.redisDel = exports.redisSet = exports.redisGet = exports.checkRedisHealth = exports.connectRedis = void 0;
// src/utils/redis.ts
const redis_1 = require("redis");
const envConfig_1 = require("../config/envConfig");
const redisClient = (0, redis_1.createClient)({
    url: envConfig_1.envVars.REDIS_URL, // e.g. redis://localhost:6379
    socket: {
        reconnectStrategy: (retries) => {
            const maxDelay = 10000;
            const delay = Math.min(Math.pow(2, retries) * 100, maxDelay);
            console.log(`Redis reconnecting... Attempt ${retries + 1}, waiting ${delay}ms`);
            if (retries > 20) {
                console.error("Redis max retries reached, stopping reconnection attempts");
                return new Error("Redis max retries reached");
            }
            return delay;
        },
        connectTimeout: 10000,
        keepAlive: true,
        noDelay: true,
    },
    commandsQueueMaxLength: 10000,
});
// Connection event handlers
redisClient.on("error", (err) => {
    console.error("❌ Redis Error:", err);
    if (err.code === 'ECONNRESET') {
        console.log("Connection reset by Redis server, will attempt to reconnect...");
    }
    else if (err.code === 'ECONNREFUSED') {
        console.log("Redis connection refused, check if Redis server is running");
    }
    else if (err.code === 'ETIMEDOUT') {
        console.log("Redis connection timeout");
    }
});
redisClient.on("connect", () => {
    console.log("✅ Redis connected successfully");
});
redisClient.on("ready", () => {
    console.log("✅ Redis is ready to accept commands");
});
redisClient.on("reconnecting", () => {
    console.log("🔄 Redis reconnecting...");
});
redisClient.on("end", () => {
    console.log("Redis connection ended");
});
// ✅ Add sendCommand method for rate-limit-redis compatibility
// This is the key fix for the error
const sendCommand = (...args) => __awaiter(void 0, void 0, void 0, function* () {
    if (!redisClient.isOpen) {
        throw new Error("Redis client is not connected");
    }
    return redisClient.sendCommand(args);
});
exports.sendCommand = sendCommand;
// Graceful shutdown
const gracefulShutdown = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Closing Redis connection...");
    if (redisClient && redisClient.isOpen) {
        yield redisClient.quit();
        console.log("Redis connection closed");
    }
    process.exit(0);
});
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
const connectRedis = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!redisClient.isOpen) {
            console.log("Connecting to Redis...");
            yield redisClient.connect();
            console.log("Redis connection established");
        }
        else {
            console.log("Redis already connected");
        }
    }
    catch (error) {
        console.error("Failed to connect to Redis:", error);
        console.warn("⚠️ Running without Redis cache - some features may be degraded");
    }
});
exports.connectRedis = connectRedis;
// Health check function
const checkRedisHealth = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!redisClient.isOpen) {
            return { healthy: false, error: "Redis not connected" };
        }
        yield redisClient.ping();
        return { healthy: true };
    }
    catch (error) {
        return { healthy: false, error: error instanceof Error ? error.message : String(error) };
    }
});
exports.checkRedisHealth = checkRedisHealth;
// Wrapper functions with automatic reconnection
const redisGet = (key) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!redisClient.isOpen) {
            yield (0, exports.connectRedis)();
        }
        return yield redisClient.get(key);
    }
    catch (error) {
        console.error(`Redis GET error for key ${key}:`, error);
        return null;
    }
});
exports.redisGet = redisGet;
const redisSet = (key_1, value_1, ...args_1) => __awaiter(void 0, [key_1, value_1, ...args_1], void 0, function* (key, value, options = {}) {
    try {
        if (!redisClient.isOpen) {
            yield (0, exports.connectRedis)();
        }
        if (options.expiry) {
            yield redisClient.setEx(key, options.expiry, value);
        }
        else {
            yield redisClient.set(key, value);
        }
        return true;
    }
    catch (error) {
        console.error(`Redis SET error for key ${key}:`, error);
        return false;
    }
});
exports.redisSet = redisSet;
const redisDel = (key) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!redisClient.isOpen) {
            yield (0, exports.connectRedis)();
        }
        yield redisClient.del(key);
        return true;
    }
    catch (error) {
        console.error(`Redis DEL error for key ${key}:`, error);
        return false;
    }
});
exports.redisDel = redisDel;
exports.default = redisClient;
