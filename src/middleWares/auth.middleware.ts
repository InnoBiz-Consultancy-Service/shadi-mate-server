import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import AppError from "../helpers/AppError";
import { isAccessTokenBlacklisted, verifyAccessToken } from "../utils/token.utils";
import { getCachedUser, setCachedUser, TCachedUser } from "../app/modules/user/user.cache";
import { User } from "../app/modules/user/user.model";
import { JwtPayload } from "jsonwebtoken";


export interface AuthRequest extends Request {
    user?: JwtPayload & { id: string; role: string };
}

const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
    try {
        // ── Step 1: Extract token ─────────────────────────────────────────────
        // FIX: "Bearer <token>" এবং raw "<token>" দুটোই accept করে
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            throw new AppError(StatusCodes.UNAUTHORIZED, "No token provided");
        }

        // "Bearer eyJ..." হলে split করে নাও, না হলে পুরোটাই token
        const token = authHeader.startsWith("Bearer ")
            ? authHeader.slice(7)   // "Bearer " = 7 chars
            : authHeader.trim();

        if (!token) {
            throw new AppError(StatusCodes.UNAUTHORIZED, "No token provided");
        }

        // ── Step 2: JWT verify ────────────────────────────────────────────────
        const decoded = verifyAccessToken(token);

        // ── Step 3: Blacklist check ───────────────────────────────────────────
        const jti = token.split(".")[2];
        const blacklisted = await isAccessTokenBlacklisted(jti);

        if (blacklisted) {
            throw new AppError(
                StatusCodes.UNAUTHORIZED,
                "Token has been revoked. Please login again"
            );
        }

        // ── Step 4: Redis cache check ─────────────────────────────────────────
        let freshUser: TCachedUser | null = await getCachedUser(decoded.id);

        // ── Step 5: Cache miss → DB ───────────────────────────────────────────
        if (!freshUser) {
            const dbUser = await User.findById(decoded.id)
                .select("role isVerified isProfileCompleted subscription isBlocked isDeleted")
                .lean();

            if (!dbUser) {
                throw new AppError(StatusCodes.UNAUTHORIZED, "User not found");
            }

            freshUser = {
                _id:                String(dbUser._id),
                role:               dbUser.role,
                isVerified:         dbUser.isVerified,
                isProfileCompleted: dbUser.isProfileCompleted as boolean,
                subscription:       dbUser.subscription,
                isBlocked:          dbUser.isBlocked,
                isDeleted:          dbUser.isDeleted,
            };

            await setCachedUser(freshUser);
        }

        // ── Step 6: Guard checks ──────────────────────────────────────────────
        if (freshUser.isDeleted) {
            throw new AppError(StatusCodes.UNAUTHORIZED, "Account no longer exists");
        }
        if (freshUser.isBlocked) {
            throw new AppError(StatusCodes.FORBIDDEN, "Your account has been blocked");
        }
        if (!freshUser.isVerified) {
            throw new AppError(StatusCodes.FORBIDDEN, "Please verify your account first");
        }

        // ── Step 7: Attach live user to request ───────────────────────────────
        req.user = freshUser;

        next();
    } catch (err) {
        next(err);
    }
};

export default authenticate;

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