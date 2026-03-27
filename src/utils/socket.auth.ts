import jwt from "jsonwebtoken";
import { envVars } from "../config/envConfig";
export const verifyToken = (token: string) => {
    try {
        return jwt.verify(token, envVars.JWT_SECRET) as any;
    } catch {
        return null;
    }
};