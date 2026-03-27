import { createClient } from 'redis';
import { envVars } from '../config/envConfig';

export const redisClient = createClient({
  url: envVars.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('❌ Redis Error:', err));
redisClient.on('connect', () => console.log('✅ Redis connected'));
redisClient.on('ready', () => console.log('🔹 Redis ready'));
redisClient.on('reconnecting', () => console.log('♻️ Redis reconnecting'));
redisClient.on('end', () => console.log('⚠️ Redis connection closed'));

export const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log("☎️  Redis Connected Successfully");
    }
  } catch (error) {
    console.error("❌ Could not connect to Redis:", error);
  }
};