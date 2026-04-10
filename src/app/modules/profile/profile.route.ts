import express from "express";
import { ProfileController } from "./profile.controller";
import authenticate from "../../../middleWares/auth.middleware";

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

// ─── Get My Profile ─────────────────────────
router.get(
    "/my",
    authenticate,
    ProfileController.getMyProfile
);

// ─── Get Profile by ID ─────────────────────────
router.get(
    "/:id",
    authenticate,
    ProfileController.getProfileById
);

export const ProfileRoutes = router;