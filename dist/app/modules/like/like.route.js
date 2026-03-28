"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const like_controller_1 = require("./like.controller");
const auth_middleware_1 = require("../../../middleWares/auth.middleware");
const LikeRoutes = (0, express_1.Router)();
// ─── Toggle Like / Unlike a profile ──────────────────────────────────────────
// POST /api/v1/likes/:userId
LikeRoutes.post("/:userId", auth_middleware_1.authenticate, like_controller_1.LikeController.toggleLike);
// ─── Get like count of any profile ───────────────────────────────────────────
// GET /api/v1/likes/count/:userId
LikeRoutes.get("/count/:userId", auth_middleware_1.authenticate, like_controller_1.LikeController.getLikeCount);
// ─── Get who liked me (Premium only) ─────────────────────────────────────────
// GET /api/v1/likes/who-liked-me
LikeRoutes.get("/who-liked-me", auth_middleware_1.authenticate, like_controller_1.LikeController.getWhoLikedMe);
// ─── Get my given likes ───────────────────────────────────────────────────────
// GET /api/v1/likes/my-likes
LikeRoutes.get("/my-likes", auth_middleware_1.authenticate, like_controller_1.LikeController.getMyLikes);
exports.default = LikeRoutes;
