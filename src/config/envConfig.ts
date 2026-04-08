import dotenv from "dotenv";

dotenv.config()

interface EnvConfig {
    PORT: string,
    DB_URL: string,
    NODE_ENV: "development" | "production",
    JWT_SECRET: string,
    JWT_EXPIRES_IN: string,
    SUPER_ADMIN_EMAIL: string,
    SUPER_ADMIN_PASSWORD: string,
    BCRYPT_SALT_ROUND: string,
    FRONTEND_URL: string,
    REDIS_URL: string,
    EPS_HASH_KEY: string,
    EPS_PASSWORD: string,
    EPS_USERNAME: string,
    EPS_STORE_ID: string,
    EPS_MERCHANT_ID: string,
    BACKEND_URL: string
}

const loadEnvVariables = (): EnvConfig => {
    const requiredEnvVariables: string[] = ["PORT", "DB_URL", "NODE_ENV", "JWT_SECRET", "JWT_EXPIRES_IN", "SUPER_ADMIN_EMAIL", "SUPER_ADMIN_PASSWORD", "BCRYPT_SALT_ROUND", "FRONTEND_URL", "REDIS_URL", "EPS_HASH_KEY", "EPS_PASSWORD", "EPS_USERNAME", "EPS_STORE_ID", "EPS_MERCHANT_ID", "BACKEND_URL"];

    requiredEnvVariables.forEach(key => {
        if (!process.env[key]) {
            throw new Error(`Missing required environment variable: ${key}`)
        }
    })

    return {
        PORT: process.env.PORT as string,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        DB_URL: process.env.DB_URL!,
        NODE_ENV: process.env.NODE_ENV as "development" | "production",
        JWT_SECRET: process.env.JWT_SECRET as string,
        JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN as string,
        SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL as string,
        SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD as string,
        BCRYPT_SALT_ROUND: process.env.BCRYPT_SALT_ROUND as string,
        FRONTEND_URL: process.env.FRONEND_URL as string,
        REDIS_URL: process.env.REDIS_URL as string,
        EPS_HASH_KEY: process.env.EPS_HASH_KEY as string,
        EPS_PASSWORD: process.env.EPS_PASSWORD as string,
        EPS_USERNAME: process.env.EPS_USERNAME as string,
        EPS_STORE_ID: process.env.EPS_STORE_ID as string,
        EPS_MERCHANT_ID: process.env.EPS_MERCHANT_ID as string,
        BACKEND_URL: process.env.BACKEND_URL as string
    }
}

export const envVars = loadEnvVariables()