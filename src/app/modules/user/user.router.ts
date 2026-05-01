import { Router } from "express";
import { UserController } from "./user.controller";
import { validateRequest } from "../../../middleWares/validateRequest";
import {
  resetPasswordSchema,
  loginSchema,
  registerSchema,
  verifyOtpSchema,
} from "./user.validation";
import authenticate from "../../../middleWares/auth.middleware";
import { burstLimiter, forgotPasswordLimiter, loginLimiter, otpLimiter, registerLimiter } from "../../../middleWares/rateLimiter";


const UserRoutes = Router();

// ─── Public Routes ────────────────────────────────────────────────────────────
// সব auth route এ burstLimiter first — bot script আটকাবে (20 req/sec)
// তারপর specific limiter — window-based throttle

// POST /api/v1/auth — Register
// burst → 20/sec | register → 5/15min
UserRoutes.post(
  "/",
  burstLimiter,
  registerLimiter,
  validateRequest(registerSchema),
  UserController.register
);

// POST /api/v1/auth/verify-otp
// burst → 20/sec | otp → 5/10min per IP+phone
UserRoutes.post(
  "/verify-otp",
  burstLimiter,
  otpLimiter,
  validateRequest(verifyOtpSchema),
  UserController.verifyOtp
);

// POST /api/v1/auth/login
// burst → 20/sec | login → 5/15min
UserRoutes.post(
  "/login",
  burstLimiter,
  loginLimiter,
  validateRequest(loginSchema),
  UserController.login
);

// POST /api/v1/auth/resend-otp
// burst → 20/sec | otp → 5/10min per IP+phone
UserRoutes.post("/resend-otp", burstLimiter, otpLimiter, UserController.resendOtp);

// POST /api/v1/auth/forgot-password
// burst → 20/sec | forgot → 5/1hour
UserRoutes.post(
  "/forgot-password",
  burstLimiter,
  forgotPasswordLimiter,
  UserController.forgotPassword
);

// POST /api/v1/auth/verify-reset-otp
// burst → 20/sec | otp → 5/10min per IP+phone
UserRoutes.post(
  "/verify-reset-otp",
  burstLimiter,
  otpLimiter,
  UserController.verifyResetOtp
);

// ─── Protected Routes ─────────────────────────────────────────────────────────

UserRoutes.get("/me", authenticate, UserController.getMe);
UserRoutes.patch("/", authenticate, UserController.updateUser);

UserRoutes.post(
  "/reset-password",
  authenticate,
  validateRequest(resetPasswordSchema),
  UserController.resetPassword
);

UserRoutes.patch("/delete-profile/:id", authenticate, UserController.deleteUser);
UserRoutes.patch("/block-user/:id", authenticate, UserController.updateBlockStatus);

// POST /api/v1/auth/refresh — token refresh
UserRoutes.post("/refresh", UserController.refreshToken);

export default UserRoutes;