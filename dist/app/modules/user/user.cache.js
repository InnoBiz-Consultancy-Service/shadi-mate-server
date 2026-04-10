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
exports.invalidateUserCache = exports.setCachedUser = exports.getCachedUser = void 0;
const redis_1 = __importDefault(require("../../../utils/redis"));
// ─── Constants ────────────────────────────────────────────────────────────────
const USER_CACHE_PREFIX = "user:";
const USER_CACHE_TTL = 300; // 5 minutes
// ─── Get Cached User ──────────────────────────────────────────────────────────
const getCachedUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cached = yield redis_1.default.get(`${USER_CACHE_PREFIX}${userId}`);
        return cached ? JSON.parse(cached) : null;
    }
    catch (_a) {
        return null; // Redis failure → fallback to DB, never crash
    }
});
exports.getCachedUser = getCachedUser;
// ─── Set User Cache ───────────────────────────────────────────────────────────
const setCachedUser = (user) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield redis_1.default.setEx(`${USER_CACHE_PREFIX}${user._id}`, USER_CACHE_TTL, JSON.stringify(user));
    }
    catch (_a) {
        // Silent fail — cache is best-effort
    }
});
exports.setCachedUser = setCachedUser;
// ─── Invalidate User Cache ────────────────────────────────────────────────────
// Call this whenever user data changes:
// - subscription update
// - role change
// - block/unblock
// - profile completion
const invalidateUserCache = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield redis_1.default.del(`${USER_CACHE_PREFIX}${userId}`);
    }
    catch (_a) {
        // Silent fail
    }
});
exports.invalidateUserCache = invalidateUserCache;
