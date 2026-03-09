import express from "express";
import { ProfileController } from "./profile.controller";

const router = express.Router();

router.post("/", ProfileController.createProfile);

export const ProfileRoutes = router;