import { createClient } from "redis";
import { envVars } from "../config/envConfig";

const redisClient = createClient({
    url: envVars.REDIS_URL, // e.g. redis://localhost:6379
});

redisClient.on("error", (err) => console.error("❌ Redis Error:", err));
redisClient.on("connect", () => console.log("✅ Redis connected"));

export const connectRedis = async () => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
};

export default redisClient;