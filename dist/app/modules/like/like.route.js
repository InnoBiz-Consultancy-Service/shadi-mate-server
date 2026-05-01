"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const like_controller_1 = require("./like.controller");
const auth_middleware_1 = __importDefault(require("../../../middleWares/auth.middleware"));
const rateLimiter_1 = require("../../../middleWares/rateLimiter");
const LikeRoutes = (0, express_1.Router)();
// POST /api/v1/likes/:userId — 30/min per user
LikeRoutes.post("/:userId", auth_middleware_1.default, rateLimiter_1.likeLimiter, like_controller_1.LikeController.toggleLike);
// GET /api/v1/likes/count/:userId
LikeRoutes.get("/count/:userId", auth_middleware_1.default, like_controller_1.LikeController.getLikeCount);
// GET /api/v1/likes/who-liked-me (Premium only)
LikeRoutes.get("/who-liked-me", auth_middleware_1.default, like_controller_1.LikeController.getWhoLikedMe);
// GET /api/v1/likes/my-likes
LikeRoutes.get("/my-likes", auth_middleware_1.default, like_controller_1.LikeController.getMyLikes);
exports.default = LikeRoutes;
