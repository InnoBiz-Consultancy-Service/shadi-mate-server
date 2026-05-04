"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const compression_1 = __importDefault(require("compression")); // ← NEW
const globalErrorHandler_1 = require("./middleWares/globalErrorHandler");
const notFound_1 = require("./middleWares/notFound");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const envConfig_1 = require("./config/envConfig");
const rateLimiter_1 = require("./middleWares/rateLimiter");
const index_1 = require("./app/routes/index ");
const app = (0, express_1.default)();
// ─── CHANGE 2: Compression Middleware ─────────────────────────────────────────
// HTTP response গুলো gzip/deflate compress করে পাঠাবে।
// 100 user এ যদি প্রতি response 10KB হয় → compress করলে ~2-3KB হয়।
// Profile list, conversation list এর মতো বড় response এ 60-80% bandwidth বাঁচে।
// threshold: 1024 — 1KB এর বেশি response হলেই compress করবে, ছোট response skip করবে
app.use((0, compression_1.default)({
    level: 6, // 1-9 scale। 6 = balanced (speed vs compression ratio)
    threshold: 1024, // 1KB এর নিচে compress করবে না (overhead বেশি হবে)
    filter: (req, res) => {
        // JSON আর text response compress করবে
        if (req.headers["x-no-compression"])
            return false;
        return compression_1.default.filter(req, res);
    },
}));
app.use(express_1.default.json({ limit: "10mb" })); // payload size limit
app.use((0, cors_1.default)({
    origin: envConfig_1.envVars.FRONTEND_URL,
    credentials: true,
}));
app.set("trust proxy", true);
app.use((0, cookie_parser_1.default)());
app.use(rateLimiter_1.globalLimiter);
app.use("/api/v1", index_1.router);
app.get("/", (_req, res) => {
    res.status(200).json({ message: "Welcome to Shadi Mate Server" });
});
// Health check endpoint (rate limiter skip করে)
app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});
app.use(globalErrorHandler_1.globalErrorHandler);
app.use(notFound_1.notFoundHandler);
exports.default = app;
