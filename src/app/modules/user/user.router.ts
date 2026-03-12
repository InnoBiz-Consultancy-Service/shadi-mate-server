import { Router } from "express";
import { UserController } from "./user.controller";
import { validateRequest } from "../../../middleWares/validateRequest";
import { forgetPasswordSchema, loginSchema, registerSchema, verifyOtpSchema } from "./user.validation";
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
    "/forget-password",
    validateRequest(forgetPasswordSchema),  
    UserController.forgetPassword
);
UserRoutes.patch("/delete-profile/:id", authenticate, UserController.deleteUser);
UserRoutes.patch("/block-user/:id", authenticate, UserController.updateBlockStatus);

export default UserRoutes;
