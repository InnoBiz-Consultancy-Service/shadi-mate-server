import { Router } from "express";
import { UserController } from "./user.controller";
import { validateRequest } from "../../../middleWares/validateRequest";
import { resetPasswordSchema, loginSchema, registerSchema, verifyOtpSchema } from "./user.validation";
import { authenticate } from "../../../middleWares/auth.middleware";

const UserRoutes = Router();

// ─── Public Routes ────────────────────────────────────────────────────────────



UserRoutes.post(
  "/",
  validateRequest(registerSchema),
  UserController.register
);


UserRoutes.post(
  "/verify-otp",
  validateRequest(verifyOtpSchema),
  UserController.verifyOtp
);


UserRoutes.post(
  "/login",
  validateRequest(loginSchema),
  UserController.login
);


UserRoutes.post("/resend-otp", UserController.resendOtp);

// ─── Protected Routes ─────────────────────────────────────────────────────────
UserRoutes.get("/me", authenticate, UserController.getMe);
UserRoutes.patch("/", authenticate, UserController.updateUser);
UserRoutes.post(
  "/reset-password",
  validateRequest(resetPasswordSchema),
  UserController.resetPassword
);


UserRoutes.post(
  "/forgot-password",
  UserController.forgotPassword
);

UserRoutes.post(
  "/verify-reset-otp",
  UserController.verifyResetOtp
);

UserRoutes.patch("/delete-profile/:id", authenticate, UserController.deleteUser);
UserRoutes.patch("/block-user/:id", authenticate, UserController.updateBlockStatus);

export default UserRoutes;
