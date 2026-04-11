"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = void 0;
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../helpers/AppError"));
const token_utils_1 = require("../utils/token.utils");
const user_cache_1 = require("../app/modules/user/user.cache");
const user_model_1 = require("../app/modules/user/user.model");
const authenticate = (req, _res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    try {
        // ── Step 1: Token extract — cookie first, header fallback ─────────────
        // Web clients use HttpOnly cookie, mobile clients use Authorization header
        const token = ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.accessToken) ||
            ((_b = req.headers.authorization) === null || _b === void 0 ? void 0 : _b.split(" ")[1]);
        if (!token) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "No token provided");
        }
        // ── Step 2: JWT signature + expiry verify ────────────────────────────
        const decoded = (0, token_utils_1.verifyAccessToken)(token); // throws if expired/tampered
        // ── Step 3: Redis blacklist check (logout / revoked tokens) ──────────
        const jti = token.split(".")[2]; // signature segment as unique ID
        const blacklisted = yield (0, token_utils_1.isAccessTokenBlacklisted)(jti);
        if (blacklisted) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Token has been revoked. Please login again");
        }
        // ── Step 4: Redis cache — fresh user data ────────────────────────────
        let freshUser = yield (0, user_cache_1.getCachedUser)(decoded.id);
        // ── Step 5: Cache miss → DB query → warm cache ───────────────────────
        if (!freshUser) {
            const dbUser = yield user_model_1.User.findById(decoded.id)
                .select("role isVerified isProfileCompleted subscription isBlocked isDeleted")
                .lean();
            if (!dbUser) {
                throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "User not found");
            }
            freshUser = {
                _id: String(dbUser._id),
                role: dbUser.role,
                isVerified: (_c = dbUser.isVerified) !== null && _c !== void 0 ? _c : false,
                isProfileCompleted: (_d = dbUser.isProfileCompleted) !== null && _d !== void 0 ? _d : false,
                subscription: dbUser.subscription,
                isBlocked: (_e = dbUser.isBlocked) !== null && _e !== void 0 ? _e : false,
                isDeleted: (_f = dbUser.isDeleted) !== null && _f !== void 0 ? _f : false,
            };
            yield (0, user_cache_1.setCachedUser)(freshUser); // next request → cache hit (~1ms)
        }
        // ── Step 6: Live status checks ───────────────────────────────────────
        if (freshUser.isDeleted) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Account no longer exists");
        }
        if (freshUser.isBlocked) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Your account has been blocked");
        }
        if (!freshUser.isVerified) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Please verify your account first");
        }
        req.user = freshUser;
        next();
    }
    catch (err) {
        next(err);
    }
});
exports.default = authenticate;
const authorize = (...roles) => {
    return (req, res, next) => {
        const authReq = req;
        if (!authReq.user || !roles.includes(authReq.user.role)) {
            return next(new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "You do not have permission to perform this action"));
        }
        next();
    };
};
exports.authorize = authorize;
