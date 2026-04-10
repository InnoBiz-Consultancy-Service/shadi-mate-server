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
const user_cache_1 = require("../utils/user.cache");
const user_model_1 = require("../app/modules/user/user.model");
/**
 * authenticate middleware — 4 step flow:
 *
 *  1. JWT signature + expiry verify
 *  2. Redis blacklist check (revoked tokens)
 *  3. Redis cache check → fresh user data (cache hit: ~1ms)
 *  4. Cache miss → DB query → populate cache (cache miss: ~5-10ms)
 *
 * Result: req.user ALWAYS has live data — subscription, role, isBlocked
 * are never stale regardless of when the JWT was issued.
 */
const authenticate = (req, _res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // ── Step 1: Extract & verify JWT ─────────────────────────────────────
        const authHeader = req.headers.authorization;
        if (!(authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith("Bearer "))) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "No token provided");
        }
        const token = authHeader.split(" ")[1];
        const decoded = (0, token_utils_1.verifyAccessToken)(token); // throws if expired/invalid
        // ── Step 2: Redis blacklist check (logout / revoked tokens) ──────────
        const jti = token.split(".")[2]; // JWT signature as unique ID
        const blacklisted = yield (0, token_utils_1.isAccessTokenBlacklisted)(jti);
        if (blacklisted) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Token has been revoked. Please login again");
        }
        // ── Step 3: Try Redis cache first ────────────────────────────────────
        let freshUser = yield (0, user_cache_1.getCachedUser)(decoded.id);
        // ── Step 4: Cache miss → hit DB, then warm cache ─────────────────────
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
                isVerified: dbUser.isVerified,
                isProfileCompleted: dbUser.isProfileCompleted,
                subscription: dbUser.subscription,
                isBlocked: dbUser.isBlocked,
                isDeleted: dbUser.isDeleted,
            };
            // Warm the cache for subsequent requests
            yield (0, user_cache_1.setCachedUser)(freshUser);
        }
        // ── Step 5: Guard checks on fresh data ───────────────────────────────
        if (freshUser.isDeleted) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Account no longer exists");
        }
        if (freshUser.isBlocked) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Your account has been blocked");
        }
        if (!freshUser.isVerified) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Please verify your account first");
        }
        // ── Step 6: Attach LIVE user data to request ──────────────────────────
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
