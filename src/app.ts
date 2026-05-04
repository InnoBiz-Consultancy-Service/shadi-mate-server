import cors         from "cors";
import express, { Request, Response } from "express";
import compression  from "compression";   // ← NEW
import { globalErrorHandler } from "./middleWares/globalErrorHandler";
import { notFoundHandler }    from "./middleWares/notFound";
import cookieParser from "cookie-parser";

import { envVars }       from "./config/envConfig";
import { globalLimiter } from "./middleWares/rateLimiter";
import { router }        from "./app/routes/index ";

const app = express();

// ─── CHANGE 2: Compression Middleware ─────────────────────────────────────────
// HTTP response গুলো gzip/deflate compress করে পাঠাবে।
// 100 user এ যদি প্রতি response 10KB হয় → compress করলে ~2-3KB হয়।
// Profile list, conversation list এর মতো বড় response এ 60-80% bandwidth বাঁচে।
// threshold: 1024 — 1KB এর বেশি response হলেই compress করবে, ছোট response skip করবে
app.use(compression({
    level:     6,      // 1-9 scale। 6 = balanced (speed vs compression ratio)
    threshold: 1024,   // 1KB এর নিচে compress করবে না (overhead বেশি হবে)
    filter: (req, res) => {
        // JSON আর text response compress করবে
        if (req.headers["x-no-compression"]) return false;
        return compression.filter(req, res);
    },
}));

app.use(express.json({ limit: "10mb" }));  // payload size limit

app.use(cors({
    origin:      envVars.FRONTEND_URL,
    credentials: true,
}));

app.set("trust proxy", true);
app.use(cookieParser());
app.use(globalLimiter);
app.use("/api/v1", router);

app.get("/", (_req: Request, res: Response) => {
    res.status(200).json({ message: "Welcome to Shadi Mate Server" });
});

// Health check endpoint (rate limiter skip করে)
app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(globalErrorHandler);
app.use(notFoundHandler);

export default app;
