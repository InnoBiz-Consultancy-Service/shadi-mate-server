import express from "express";
import { AlbumController } from "./album.controller";
import authenticate from "../../../middleWares/auth.middleware";
import { albumLimiter } from "../../../middleWares/rateLimiter";

const router = express.Router();

// POST /api/v1/album/add — 20/15min per user
router.post("/add", authenticate, albumLimiter, AlbumController.addPhoto);

// GET /api/v1/album
router.get("/", authenticate, AlbumController.getMyAlbum);

// GET /api/v1/album/:userId
router.get("/:userId", authenticate, AlbumController.getUserAlbum);

// PATCH /api/v1/album/:photoId — 20/15min per user
router.patch("/:photoId", authenticate, albumLimiter, AlbumController.updatePhoto);

// DELETE /api/v1/album/delete/:photoId — 20/15min per user
router.delete(
  "/delete/:photoId",
  authenticate,
  albumLimiter,
  AlbumController.deletePhoto
);

export const AlbumRoutes = router;