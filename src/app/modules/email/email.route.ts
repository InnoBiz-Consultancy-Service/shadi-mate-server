import { Router } from "express";
import { EmailController } from "./email.controller";
import authenticate, { authorize } from "../../../middleWares/auth.middleware";

const router = Router();

// send email (all / free / premium / selected)
router.post(
  "/send",
  authenticate,
  authorize("admin"),
  EmailController.sendEmail
);

// preview আগে দেখার জন্য
router.post(
  "/preview",
  authenticate,
  authorize("admin"),
  EmailController.preview
);

// search users (selected mode)
router.get(
  "/users/search",
  authenticate,
  authorize("admin"),
  EmailController.searchUsers
);

// stats
router.get(
  "/stats",
  authenticate,
  authorize("admin"),
  EmailController.getStats
);

// campaigns list
router.get(
  "/",
  authenticate,
  authorize("admin"),
  EmailController.getAllCampaigns
);

// single campaign
router.get(
  "/:id",
  authenticate,
  authorize("admin"),
  EmailController.getCampaignById
);

export const EmailRoute =  router;