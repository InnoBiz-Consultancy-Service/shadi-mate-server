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
exports.connectRedis = exports.redisClient = void 0;
const redis_1 = require("redis");
const envConfig_1 = require("../config/envConfig");
exports.redisClient = (0, redis_1.createClient)({
    url: envConfig_1.envVars.REDIS_URL || 'redis://localhost:6379'
});
exports.redisClient.on('error', (err) => console.error('❌ Redis Error:', err));
exports.redisClient.on('connect', () => console.log('✅ Redis connected'));
exports.redisClient.on('ready', () => console.log('🔹 Redis ready'));
exports.redisClient.on('reconnecting', () => console.log('♻️ Redis reconnecting'));
exports.redisClient.on('end', () => console.log('⚠️ Redis connection closed'));
const connectRedis = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!exports.redisClient.isOpen) {
            yield exports.redisClient.connect();
            console.log("☎️  Redis Connected Successfully");
        }
    }
    catch (error) {
        console.error("❌ Could not connect to Redis:", error);
    }
});
exports.connectRedis = connectRedis;
