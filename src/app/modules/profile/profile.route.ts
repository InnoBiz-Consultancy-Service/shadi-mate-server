import express from "express";
import { ProfileController } from "./profile.controller";
import authenticate from "../../../middleWares/auth.middleware";
import { profileSearchLimiter, userLimiter } from "../../../middleWares/rateLimiter";

const router = express.Router();

// POST /api/v1/profile
router.post("/", authenticate, userLimiter, ProfileController.createProfile);

// PATCH /api/v1/profile
router.patch("/", authenticate, userLimiter, ProfileController.updateProfile);

// GET /api/v1/profile — search + browse
// profileSearchLimiter: 60/min — scraping prevent
router.get(
  "/",
  authenticate,
  profileSearchLimiter,
  ProfileController.getProfiles
);

// GET /api/v1/profile/my
router.get("/my", authenticate, ProfileController.getMyProfile);

// GET /api/v1/profile/:userId
router.get("/:userId", authenticate, ProfileController.getProfileById);

export const ProfileRoutes = router;