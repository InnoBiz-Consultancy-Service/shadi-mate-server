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
exports.connectRedis = exports.redisClient = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const envConfig_1 = require("../config/envConfig");
exports.redisClient = new ioredis_1.default(envConfig_1.envVars.REDIS_URL || 'redis://localhost:6379', {
    tls: {},
    lazyConnect: false,
    maxRetriesPerRequest: 3,
});
exports.redisClient.on('connect', () => console.log('✅ Redis connected'));
exports.redisClient.on('ready', () => console.log('🔹 Redis ready'));
exports.redisClient.on('error', (err) => console.error('❌ Redis Error:', err.message));
exports.redisClient.on('reconnecting', () => console.log('♻️ Redis reconnecting'));
const connectRedis = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield exports.redisClient.ping();
        console.log("☎️  Redis Connected Successfully");
    }
    catch (error) {
        console.error("❌ Could not connect to Redis:", error);
        process.exit(1);
    }
});
exports.connectRedis = connectRedis;
