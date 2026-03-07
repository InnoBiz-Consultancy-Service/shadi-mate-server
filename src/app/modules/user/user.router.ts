import { Router } from "express";
import { UserController } from "./user.controller";
import { validateRequest } from "../../../middleWares/validateRequest";
import { loginSchema, registerSchema, verifyOtpSchema } from "./user.validation";
import { authenticate } from "../../../middleWares/auth.middleware";

const UserRoutes = Router();

// ─── Public Routes ────────────────────────────────────────────────────────────

/**
 * @route  POST /api/v1/auth/register
 * @desc   Register with name, email, phone, password — returns OTP (mock mode)
 * @access Public
 */
UserRoutes.post(
  "/",
  validateRequest(registerSchema),
  UserController.register
);

/**
 * @route  POST /api/v1/auth/verify-otp
 * @desc   Verify phone number with OTP
 * @access Public
 */
UserRoutes.post(
  "/verify-otp",
  validateRequest(verifyOtpSchema),
  UserController.verifyOtp
);

/**
 * @route  POST /api/v1/auth/login
 * @desc   Login with phone + password — returns JWT token
 * @access Public
 */
UserRoutes.post(
  "/login",
  validateRequest(loginSchema),
  UserController.login
);

/**
 * @route  POST /api/v1/auth/resend-otp
 * @desc   Resend OTP to phone number
 * @access Public
 */
UserRoutes.post("/resend-otp", UserController.resendOtp);

// ─── Protected Routes ─────────────────────────────────────────────────────────

/**
 * @route  GET /api/v1/auth/me
 * @desc   Get logged-in user's profile
 * @access Private (requires Bearer token)
 */
UserRoutes.get("/me", authenticate, UserController.getMe);
UserRoutes.patch("/", authenticate, UserController.updateUser);
UserRoutes.patch("/delete-profile/:id", authenticate, UserController.deleteUser);
UserRoutes.patch("/block-user/:id", authenticate, UserController.updateBlockStatus);

export default UserRoutes;
