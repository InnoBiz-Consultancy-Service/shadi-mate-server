import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import AppError from "../helpers/AppError";
import {
  isAccessTokenBlacklisted,
  verifyAccessToken,
} from "../utils/token.utils";
import {
  getCachedUser,
  setCachedUser,
  TCachedUser,
} from "../app/modules/user/user.cache";
import { User } from "../app/modules/user/user.model";

declare global {
  namespace Express {
    interface UserPayload {
      id: string;
      role: string;
      subscription: string; 
    }

    interface Request {
      user?: UserPayload;
    }
  }
}

// ─── AUTHORIZE ────────────────────────────────────────────────────────────────
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
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

// ─── AUTHENTICATE ─────────────────────────────────────────────────────────────
const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = (req as any).cookies?.accessToken;

    let token: string | undefined;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (cookieToken) {
      token = cookieToken;
    }

    if (!token) {
      throw new AppError(StatusCodes.UNAUTHORIZED, "No token provided");
    }

    // ─── Token verify ─────────────────────────────────────────────────────────
    const decoded: any = verifyAccessToken(token);

    if (!decoded?.id) {
      throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid token");
    }

    if (decoded.id === "pending") {
      throw new AppError(
        StatusCodes.UNAUTHORIZED,
        "Please verify your account first"
      );
    }

    // ─── Blacklist check ──────────────────────────────────────────────────────
    const jti = token.split(".")[2];
    const blacklisted = await isAccessTokenBlacklisted(jti);

    if (blacklisted) {
      throw new AppError(
        StatusCodes.UNAUTHORIZED,
        "Token revoked. Login again"
      );
    }

    // ─── Redis cache check ────────────────────────────────────────────────────
    let user: TCachedUser | null = await getCachedUser(decoded.id);

    // ─── DB fallback — cache miss হলে ────────────────────────────────────────
    if (!user) {
      const dbUser = await User.findById(decoded.id)
        .select("role isVerified isBlocked isDeleted isProfileCompleted subscription")
        .lean();

      if (!dbUser) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "User not found");
      }

      user = {
        _id: String(dbUser._id),
        role: dbUser.role,
        isVerified: dbUser.isVerified,
        isBlocked: dbUser.isBlocked,
        isDeleted: dbUser.isDeleted,
        isProfileCompleted: dbUser.isProfileCompleted ?? false, 
        subscription: dbUser.subscription ?? "free",         
      };

      await setCachedUser(user);
    }

    // ─── Guards ───────────────────────────────────────────────────────────────
    if (user.isDeleted) {
      throw new AppError(StatusCodes.UNAUTHORIZED, "Account deleted");
    }

    if (user.isBlocked) {
      throw new AppError(StatusCodes.FORBIDDEN, "Account blocked");
    }

    if (!user.isVerified) {
      throw new AppError(StatusCodes.FORBIDDEN, "Please verify account");
    }

    req.user = {
      id: user._id,
      role: user.role,
      subscription: user.subscription, 
    };

    next();
  } catch (err) {
    next(err);
  }
};

export default authenticate;