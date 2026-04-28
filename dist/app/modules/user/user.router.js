"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("./user.controller");
const validateRequest_1 = require("../../../middleWares/validateRequest");
const user_validation_1 = require("./user.validation");
const auth_middleware_1 = __importDefault(require("../../../middleWares/auth.middleware"));
const rateLimiter_1 = require("../../../middleWares/rateLimiter");
const UserRoutes = (0, express_1.Router)();
// ─── Public Routes ────────────────────────────────────────────────────────────
// সব auth route এ burstLimiter first — bot script আটকাবে (20 req/sec)
// তারপর specific limiter — window-based throttle
// POST /api/v1/auth — Register
// burst → 20/sec | register → 5/15min
UserRoutes.post("/", rateLimiter_1.burstLimiter, rateLimiter_1.registerLimiter, (0, validateRequest_1.validateRequest)(user_validation_1.registerSchema), user_controller_1.UserController.register);
// POST /api/v1/auth/verify-otp
// burst → 20/sec | otp → 5/10min per IP+phone
UserRoutes.post("/verify-otp", rateLimiter_1.burstLimiter, rateLimiter_1.otpLimiter, (0, validateRequest_1.validateRequest)(user_validation_1.verifyOtpSchema), user_controller_1.UserController.verifyOtp);
// POST /api/v1/auth/login
// burst → 20/sec | login → 5/15min
UserRoutes.post("/login", rateLimiter_1.burstLimiter, rateLimiter_1.loginLimiter, (0, validateRequest_1.validateRequest)(user_validation_1.loginSchema), user_controller_1.UserController.login);
// POST /api/v1/auth/resend-otp
// burst → 20/sec | otp → 5/10min per IP+phone
UserRoutes.post("/resend-otp", rateLimiter_1.burstLimiter, rateLimiter_1.otpLimiter, user_controller_1.UserController.resendOtp);
// POST /api/v1/auth/forgot-password
// burst → 20/sec | forgot → 5/1hour
UserRoutes.post("/forgot-password", rateLimiter_1.burstLimiter, rateLimiter_1.forgotPasswordLimiter, user_controller_1.UserController.forgotPassword);
// POST /api/v1/auth/verify-reset-otp
// burst → 20/sec | otp → 5/10min per IP+phone
UserRoutes.post("/verify-reset-otp", rateLimiter_1.burstLimiter, rateLimiter_1.otpLimiter, user_controller_1.UserController.verifyResetOtp);
// ─── Protected Routes ─────────────────────────────────────────────────────────
UserRoutes.get("/me", auth_middleware_1.default, user_controller_1.UserController.getMe);
UserRoutes.patch("/", auth_middleware_1.default, user_controller_1.UserController.updateUser);
UserRoutes.post("/reset-password", auth_middleware_1.default, (0, validateRequest_1.validateRequest)(user_validation_1.resetPasswordSchema), user_controller_1.UserController.resetPassword);
UserRoutes.patch("/delete-profile/:id", auth_middleware_1.default, user_controller_1.UserController.deleteUser);
UserRoutes.patch("/block-user/:id", auth_middleware_1.default, user_controller_1.UserController.updateBlockStatus);
// POST /api/v1/auth/refresh — token refresh
UserRoutes.post("/refresh", user_controller_1.UserController.refreshToken);
exports.default = UserRoutes;
