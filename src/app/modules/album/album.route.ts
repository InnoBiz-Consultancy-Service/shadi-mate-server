// album.route.ts

import express from "express";
import { AlbumController } from "./album.controller";
import authenticate from "../../../middleWares/auth.middleware";

const router = express.Router();

router.post("/add", authenticate, AlbumController.addPhoto);
router.get("/", authenticate, AlbumController.getMyAlbum);
router.get("/:userId",authenticate, AlbumController.getUserAlbum);
router.patch("/:photoId", authenticate, AlbumController.updatePhoto);

router.delete("/delete/:photoId", authenticate, AlbumController.deletePhoto);

export const AlbumRoutes = router;