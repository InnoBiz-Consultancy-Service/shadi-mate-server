import Redis from 'ioredis';
import { envVars } from '../config/envConfig';

export const redisClient = new Redis(envVars.REDIS_URL || 'redis://localhost:6379', {
  tls: {},
  lazyConnect: false,
  maxRetriesPerRequest: 3,
});

redisClient.on('connect', () => console.log('✅ Redis connected'));
redisClient.on('ready', () => console.log('🔹 Redis ready'));
redisClient.on('error', (err) => console.error('❌ Redis Error:', err.message));
redisClient.on('reconnecting', () => console.log('♻️ Redis reconnecting'));

export const connectRedis = async () => {
  try {
    await redisClient.ping();
    console.log("☎️  Redis Connected Successfully");
  } catch (error) {
    console.error("❌ Could not connect to Redis:", error);
    process.exit(1);
  }
};