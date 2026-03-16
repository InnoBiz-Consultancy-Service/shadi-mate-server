import express from "express";
import { authenticate } from "../../../middleWares/auth.middleware";
import { ProfileController } from "./profile.controller";

const router = express.Router();

// ─── Create Profile ─────────────────────────
router.post(
    "/",
    authenticate,
    ProfileController.createProfile
);

// ─── Update Profile ─────────────────────────
router.patch(
    "/",
    authenticate,
    ProfileController.updateProfile
);

// ─── Get Profiles (Search + Filter) ─────────────────
router.get(
    "/", authenticate,
    ProfileController.getProfiles
);

export const ProfileRoutes = router;