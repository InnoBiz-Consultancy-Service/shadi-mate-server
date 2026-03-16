"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("./user.controller");
const validateRequest_1 = require("../../../middleWares/validateRequest");
const user_validation_1 = require("./user.validation");
const auth_middleware_1 = require("../../../middleWares/auth.middleware");
const UserRoutes = (0, express_1.Router)();
// ─── Public Routes ────────────────────────────────────────────────────────────
UserRoutes.post("/", (0, validateRequest_1.validateRequest)(user_validation_1.registerSchema), user_controller_1.UserController.register);
UserRoutes.post("/verify-otp", (0, validateRequest_1.validateRequest)(user_validation_1.verifyOtpSchema), user_controller_1.UserController.verifyOtp);
UserRoutes.post("/login", (0, validateRequest_1.validateRequest)(user_validation_1.loginSchema), user_controller_1.UserController.login);
UserRoutes.post("/resend-otp", user_controller_1.UserController.resendOtp);
// ─── Protected Routes ─────────────────────────────────────────────────────────
UserRoutes.get("/me", auth_middleware_1.authenticate, user_controller_1.UserController.getMe);
UserRoutes.patch("/", auth_middleware_1.authenticate, user_controller_1.UserController.updateUser);
UserRoutes.post("/reset-password", (0, validateRequest_1.validateRequest)(user_validation_1.resetPasswordSchema), user_controller_1.UserController.resetPassword);
UserRoutes.post("/forgot-password", user_controller_1.UserController.forgotPassword);
UserRoutes.post("/verify-reset-otp", user_controller_1.UserController.verifyResetOtp);
UserRoutes.patch("/delete-profile/:id", auth_middleware_1.authenticate, user_controller_1.UserController.deleteUser);
UserRoutes.patch("/block-user/:id", auth_middleware_1.authenticate, user_controller_1.UserController.updateBlockStatus);
exports.default = UserRoutes;
