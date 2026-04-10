import { Router } from "express";
import { LikeController } from "./like.controller";
import authenticate from "../../../middleWares/auth.middleware";
const LikeRoutes = Router();

// ─── Toggle Like / Unlike a profile ──────────────────────────────────────────
// POST /api/v1/likes/:userId
LikeRoutes.post("/:userId", authenticate, LikeController.toggleLike);

// ─── Get like count of any profile ───────────────────────────────────────────
// GET /api/v1/likes/count/:userId
LikeRoutes.get("/count/:userId", authenticate, LikeController.getLikeCount);

// ─── Get who liked me (Premium only) ─────────────────────────────────────────
// GET /api/v1/likes/who-liked-me
LikeRoutes.get("/who-liked-me", authenticate, LikeController.getWhoLikedMe);

// ─── Get my given likes ───────────────────────────────────────────────────────
// GET /api/v1/likes/my-likes
LikeRoutes.get("/my-likes", authenticate, LikeController.getMyLikes);

export default LikeRoutes;