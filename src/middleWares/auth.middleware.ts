import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import AppError from "../helpers/AppError";
import { isAccessTokenBlacklisted, verifyAccessToken } from "../utils/token.utils";
import { getCachedUser, setCachedUser, TCachedUser } from "../app/modules/user/user.cache";
import { User } from "../app/modules/user/user.model";
import { JwtPayload } from "jsonwebtoken";

export interface AuthRequest extends Request {
    user?: JwtPayload & { id: string;  role: string };
}

const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
    try {
        // ── Step 1: Token extract — cookie first, header fallback ─────────────
        // Web clients use HttpOnly cookie, mobile clients use Authorization header
        const token =
            req.cookies?.accessToken ||
            req.headers.authorization?.split(" ")[1];

        if (!token) {
            throw new AppError(StatusCodes.UNAUTHORIZED, "No token provided");
        }

        // ── Step 2: JWT signature + expiry verify ────────────────────────────
        const decoded = verifyAccessToken(token); // throws if expired/tampered

        // ── Step 3: Redis blacklist check (logout / revoked tokens) ──────────
        const jti = token.split(".")[2]; // signature segment as unique ID
        const blacklisted = await isAccessTokenBlacklisted(jti);

        if (blacklisted) {
            throw new AppError(
                StatusCodes.UNAUTHORIZED,
                "Token has been revoked. Please login again"
            );
        }

        // ── Step 4: Redis cache — fresh user data ────────────────────────────
        let freshUser: TCachedUser | null = await getCachedUser(decoded.id);

        // ── Step 5: Cache miss → DB query → warm cache ───────────────────────
        if (!freshUser) {
            const dbUser = await User.findById(decoded.id)
                .select("role isVerified isProfileCompleted subscription isBlocked isDeleted")
                .lean();

            if (!dbUser) {
                throw new AppError(StatusCodes.UNAUTHORIZED, "User not found");
            }

            freshUser = {
                _id: String(dbUser._id),
                role: dbUser.role,
                isVerified: dbUser.isVerified ?? false,
                isProfileCompleted: dbUser.isProfileCompleted ?? false,
                subscription: dbUser.subscription,
                isBlocked: dbUser.isBlocked ?? false,
                isDeleted: dbUser.isDeleted ?? false,
            };

            await setCachedUser(freshUser); // next request → cache hit (~1ms)
        }

        // ── Step 6: Live status checks ───────────────────────────────────────
        if (freshUser.isDeleted) {
            throw new AppError(StatusCodes.UNAUTHORIZED, "Account no longer exists");
        }

        if (freshUser.isBlocked) {
            throw new AppError(StatusCodes.FORBIDDEN, "Your account has been blocked");
        }

        if (!freshUser.isVerified) {
            throw new AppError(StatusCodes.FORBIDDEN, "Please verify your account first");
        }

     
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