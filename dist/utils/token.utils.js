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
exports.verifyAccessToken = exports.revokeRefreshToken = exports.isAccessTokenBlacklisted = exports.blacklistAccessToken = exports.rotateRefreshToken = exports.verifyRefreshToken = exports.signRefreshToken = exports.signAccessToken = exports.buildTokenPayload = exports.REFRESH_TOKEN_EXPIRY_SECONDS = exports.ACCESS_TOKEN_EXPIRY = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const redis_1 = __importDefault(require("./redis"));
const envConfig_1 = require("../config/envConfig");
// ─── Constants ────────────────────────────────────────────────────────────────
exports.ACCESS_TOKEN_EXPIRY = "2d";
exports.REFRESH_TOKEN_EXPIRY_SECONDS = 30 * 24 * 60 * 60; // 30 days in seconds
// Redis key prefixes
const REFRESH_TOKEN_PREFIX = "refresh:";
const BLACKLIST_PREFIX = "blacklist:";
// ─── Build Minimal Payload ────────────────────────────────────────────────────
// ❌ phone & email intentionally excluded — PII should never go in JWT
const buildTokenPayload = (user) => ({
    id: user._id,
    role: user.role,
    isVerified: user.isVerified,
    isProfileCompleted: user.isProfileCompleted,
    subscription: user.subscription,
});
exports.buildTokenPayload = buildTokenPayload;
// ─── Sign Access Token (15 min) ───────────────────────────────────────────────
const signAccessToken = (payload) => jsonwebtoken_1.default.sign(payload, envConfig_1.envVars.JWT_SECRET, {
    expiresIn: exports.ACCESS_TOKEN_EXPIRY,
});
exports.signAccessToken = signAccessToken;
// ─── Sign & Store Refresh Token (7 days, Redis) ───────────────────────────────
const signRefreshToken = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Opaque random token — NOT a JWT so payload cannot be decoded
    const refreshToken = crypto_1.default.randomBytes(64).toString("hex");
    yield redis_1.default.setEx(`${REFRESH_TOKEN_PREFIX}${userId}`, exports.REFRESH_TOKEN_EXPIRY_SECONDS, refreshToken);
    return refreshToken;
});
exports.signRefreshToken = signRefreshToken;
// ─── Verify Refresh Token Against Redis ──────────────────────────────────────
const verifyRefreshToken = (userId, token) => __awaiter(void 0, void 0, void 0, function* () {
    const stored = yield redis_1.default.get(`${REFRESH_TOKEN_PREFIX}${userId}`);
    return stored === token;
});
exports.verifyRefreshToken = verifyRefreshToken;
// ─── Rotate Refresh Token ────────────────────────────────────────────────────
// Old token deleted, new one issued — prevents replay attacks
const rotateRefreshToken = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    yield redis_1.default.del(`${REFRESH_TOKEN_PREFIX}${userId}`);
    return (0, exports.signRefreshToken)(userId);
});
exports.rotateRefreshToken = rotateRefreshToken;
// ─── Blacklist Access Token (Logout) ─────────────────────────────────────────
const blacklistAccessToken = (jti, expiresIn // remaining TTL in seconds
) => __awaiter(void 0, void 0, void 0, function* () {
    yield redis_1.default.setEx(`${BLACKLIST_PREFIX}${jti}`, expiresIn, "1");
});
exports.blacklistAccessToken = blacklistAccessToken;
// ─── Check if Access Token is Blacklisted ────────────────────────────────────
const isAccessTokenBlacklisted = (jti) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield redis_1.default.get(`${BLACKLIST_PREFIX}${jti}`);
    return result === "1";
});
exports.isAccessTokenBlacklisted = isAccessTokenBlacklisted;
// ─── Revoke Refresh Token (Logout) ───────────────────────────────────────────
const revokeRefreshToken = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    yield redis_1.default.del(`${REFRESH_TOKEN_PREFIX}${userId}`);
});
exports.revokeRefreshToken = revokeRefreshToken;
// ─── Verify & Decode Access Token ────────────────────────────────────────────
const verifyAccessToken = (token) => {
    return jsonwebtoken_1.default.verify(token, envConfig_1.envVars.JWT_SECRET);
};
exports.verifyAccessToken = verifyAccessToken;
