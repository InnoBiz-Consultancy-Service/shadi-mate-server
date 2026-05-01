import { Router } from "express";
import { LikeController } from "./like.controller";
import authenticate from "../../../middleWares/auth.middleware";
import { likeLimiter } from "../../../middleWares/rateLimiter";

const LikeRoutes = Router();

// POST /api/v1/likes/:userId — 30/min per user
LikeRoutes.post("/:userId", authenticate, likeLimiter, LikeController.toggleLike);

// GET /api/v1/likes/count/:userId
LikeRoutes.get("/count/:userId", authenticate, LikeController.getLikeCount);

// GET /api/v1/likes/who-liked-me (Premium only)
LikeRoutes.get("/who-liked-me", authenticate, LikeController.getWhoLikedMe);

// GET /api/v1/likes/my-likes
LikeRoutes.get("/my-likes", authenticate, LikeController.getMyLikes);

export default LikeRoutes;