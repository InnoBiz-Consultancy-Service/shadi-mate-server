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
// ─── AUTHORIZE ────────────────────────────────────────────────────────────────
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "You do not have permission to perform this action"));
        }
        next();
    };
};
exports.authorize = authorize;
// ─── AUTHENTICATE ─────────────────────────────────────────────────────────────
const authenticate = (req, _res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const authHeader = req.headers.authorization;
        const cookieToken = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.accessToken;
        let token;
        if (authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        }
        else if (cookieToken) {
            token = cookieToken;
        }
        if (!token) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "No token provided");
        }
        // ─── Token verify ─────────────────────────────────────────────────────────
        const decoded = (0, token_utils_1.verifyAccessToken)(token);
        if (!(decoded === null || decoded === void 0 ? void 0 : decoded.id)) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Invalid token");
        }
        if (decoded.id === "pending") {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Please verify your account first");
        }
        // ─── Blacklist check ──────────────────────────────────────────────────────
        const jti = token.split(".")[2];
        const blacklisted = yield (0, token_utils_1.isAccessTokenBlacklisted)(jti);
        if (blacklisted) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Token revoked. Login again");
        }
        // ─── Redis cache check ────────────────────────────────────────────────────
        let user = yield (0, user_cache_1.getCachedUser)(decoded.id);
        // ─── DB fallback — cache miss হলে ────────────────────────────────────────
        if (!user) {
            const dbUser = yield user_model_1.User.findById(decoded.id)
                .select("role isVerified isBlocked isDeleted isProfileCompleted subscription")
                .lean();
            if (!dbUser) {
                throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "User not found");
            }
            user = {
                _id: String(dbUser._id),
                role: dbUser.role,
                isVerified: dbUser.isVerified,
                isBlocked: dbUser.isBlocked,
                isDeleted: dbUser.isDeleted,
                isProfileCompleted: (_b = dbUser.isProfileCompleted) !== null && _b !== void 0 ? _b : false,
                subscription: (_c = dbUser.subscription) !== null && _c !== void 0 ? _c : "free",
            };
            yield (0, user_cache_1.setCachedUser)(user);
        }
        // ─── Guards ───────────────────────────────────────────────────────────────
        if (user.isDeleted) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Account deleted");
        }
        if (user.isBlocked) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Account blocked");
        }
        if (!user.isVerified) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Please verify account");
        }
        req.user = {
            id: user._id,
            role: user.role,
            subscription: user.subscription,
        };
        next();
    }
    catch (err) {
        next(err);
    }
});
exports.default = authenticate;
