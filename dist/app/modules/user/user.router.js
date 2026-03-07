"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("./user.controller");
const validateRequest_1 = require("../../../middleWares/validateRequest");
const user_validation_1 = require("./user.validation");
const auth_middleware_1 = require("../../../middleWares/auth.middleware");
const UserRoutes = (0, express_1.Router)();
// ─── Public Routes ────────────────────────────────────────────────────────────
/**
 * @route  POST /api/v1/auth/register
 * @desc   Register with name, email, phone, password — returns OTP (mock mode)
 * @access Public
 */
UserRoutes.post("/", (0, validateRequest_1.validateRequest)(user_validation_1.registerSchema), user_controller_1.UserController.register);
/**
 * @route  POST /api/v1/auth/verify-otp
 * @desc   Verify phone number with OTP
 * @access Public
 */
UserRoutes.post("/verify-otp", (0, validateRequest_1.validateRequest)(user_validation_1.verifyOtpSchema), user_controller_1.UserController.verifyOtp);
/**
 * @route  POST /api/v1/auth/login
 * @desc   Login with phone + password — returns JWT token
 * @access Public
 */
UserRoutes.post("/login", (0, validateRequest_1.validateRequest)(user_validation_1.loginSchema), user_controller_1.UserController.login);
/**
 * @route  POST /api/v1/auth/resend-otp
 * @desc   Resend OTP to phone number
 * @access Public
 */
UserRoutes.post("/resend-otp", user_controller_1.UserController.resendOtp);
// ─── Protected Routes ─────────────────────────────────────────────────────────
/**
 * @route  GET /api/v1/auth/me
 * @desc   Get logged-in user's profile
 * @access Private (requires Bearer token)
 */
UserRoutes.get("/me", auth_middleware_1.authenticate, user_controller_1.UserController.getMe);
UserRoutes.patch("/", auth_middleware_1.authenticate, user_controller_1.UserController.updateUser);
UserRoutes.patch("/delete-profile/:id", auth_middleware_1.authenticate, user_controller_1.UserController.deleteUser);
UserRoutes.patch("/block-user/:id", auth_middleware_1.authenticate, user_controller_1.UserController.updateBlockStatus);
exports.default = UserRoutes;
