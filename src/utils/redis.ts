// src/utils/redis.ts
import { createClient, RedisArgument } from "redis";
import { envVars } from "../config/envConfig";

const redisClient = createClient({
    url: envVars.REDIS_URL, // e.g. redis://localhost:6379
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
    } else if (err.code === 'ECONNREFUSED') {
        console.log("Redis connection refused, check if Redis server is running");
    } else if (err.code === 'ETIMEDOUT') {
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
const sendCommand = async (...args: string[]): Promise<any> => {
    if (!redisClient.isOpen) {
        throw new Error("Redis client is not connected");
    }
  
    return redisClient.sendCommand(args);
};

// Graceful shutdown
const gracefulShutdown = async () => {
    console.log("Closing Redis connection...");
    if (redisClient && redisClient.isOpen) {
        await redisClient.quit();
        console.log("Redis connection closed");
    }
    process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

export const connectRedis = async () => {
    try {
        if (!redisClient.isOpen) {
            console.log("Connecting to Redis...");
            await redisClient.connect();
            console.log("Redis connection established");
        } else {
            console.log("Redis already connected");
        }
    } catch (error) {
        console.error("Failed to connect to Redis:", error);
        console.warn("⚠️ Running without Redis cache - some features may be degraded");
    }
};

// Health check function
export const checkRedisHealth = async () => {
    try {
        if (!redisClient.isOpen) {
            return { healthy: false, error: "Redis not connected" };
        }
        await redisClient.ping();
        return { healthy: true };
    } catch (error) {
        return { healthy: false, error: error instanceof Error ? error.message : String(error) };
    }
};

// Wrapper functions with automatic reconnection
export const redisGet = async (key: RedisArgument) => {
    try {
        if (!redisClient.isOpen) {
            await connectRedis();
        }
        return await redisClient.get(key);
    } catch (error) {
        console.error(`Redis GET error for key ${key}:`, error);
        return null;
    }
};

export const redisSet = async (key: string, value: string, options: { expiry?: number } = {}) => {
    try {
        if (!redisClient.isOpen) {
            await connectRedis();
        }
        if (options.expiry) {
            await redisClient.setEx(key, options.expiry, value);
        } else {
            await redisClient.set(key, value);
        }
        return true;
    } catch (error) {
        console.error(`Redis SET error for key ${key}:`, error);
        return false;
    }
};

export const redisDel = async (key: string | string[]) => {
    try {
        if (!redisClient.isOpen) {
            await connectRedis();
        }
        await redisClient.del(key);
        return true;
    } catch (error) {
        console.error(`Redis DEL error for key ${key}:`, error);
        return false;
    }
};

// ✅ Export sendCommand for rate-limit-redis
export { sendCommand };

export default redisClient;