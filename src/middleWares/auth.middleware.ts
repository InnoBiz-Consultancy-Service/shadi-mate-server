import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import AppError from "../helpers/AppError";
import { envVars } from "../config/envConfig";

export interface AuthRequest extends Request {
    user?: JwtPayload & { id: string; phone: string; role: string };
}

export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const authReq = req as AuthRequest;
    let token: string | undefined;

    const authHeader = authReq.headers.authorization;

    if (authHeader) {
        if (authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        } else {
            token = authHeader;
        }
    }

    // fallback: x-access-token header check
    if (!token && authReq.headers["x-access-token"]) {
        token = authReq.headers["x-access-token"] as string;
    }

    if (!token) {
        return next(
            new AppError(StatusCodes.UNAUTHORIZED, "Access denied. No token provided")
        );
    }

    try {
        const decoded = jwt.verify(token, envVars.JWT_SECRET) as JwtPayload & {
            id: string;
            phone: string;
            role: string;
        };

        authReq.user = decoded;
        next();
    } catch {
        return next(
            new AppError(StatusCodes.UNAUTHORIZED, "Invalid or expired token")
        );
    }
};

export const authorize = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const authReq = req as AuthRequest;
        if (!authReq.user || !roles.includes(authReq.user.role)) {
            return next(
                new AppError(
                    StatusCodes.FORBIDDEN,
                    "You do not have permission to perform this action"
                )
            );
        }
        next();
    };
};
