"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.envVars = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const loadEnvVariables = () => {
    const requiredEnvVariables = ["PORT", "DB_URL", "NODE_ENV", "JWT_SECRET", "JWT_EXPIRES_IN", "SUPER_ADMIN_EMAIL", "SUPER_ADMIN_PASSWORD", "BCRYPT_SALT_ROUND", "FRONTEND_URL", "REDIS_URL", "EPS_HASH_KEY", "EPS_PASSWORD", "EPS_USERNAME", "EPS_STORE_ID", "EPS_MERCHANT_ID", "BACKEND_URL"];
    requiredEnvVariables.forEach(key => {
        if (!process.env[key]) {
            throw new Error(`Missing required environment variable: ${key}`);
        }
    });
    return {
        PORT: process.env.PORT,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        DB_URL: process.env.DB_URL,
        NODE_ENV: process.env.NODE_ENV,
        JWT_SECRET: process.env.JWT_SECRET,
        JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
        SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL,
        SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD,
        BCRYPT_SALT_ROUND: process.env.BCRYPT_SALT_ROUND,
        FRONTEND_URL: process.env.FRONTEND_URL,
        REDIS_URL: process.env.REDIS_URL,
        EPS_HASH_KEY: process.env.EPS_HASH_KEY,
        EPS_PASSWORD: process.env.EPS_PASSWORD,
        EPS_USERNAME: process.env.EPS_USERNAME,
        EPS_STORE_ID: process.env.EPS_STORE_ID,
        EPS_MERCHANT_ID: process.env.EPS_MERCHANT_ID,
        BACKEND_URL: process.env.BACKEND_URL
    };
};
exports.envVars = loadEnvVariables();
