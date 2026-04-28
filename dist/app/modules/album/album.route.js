"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlbumRoutes = void 0;
const express_1 = __importDefault(require("express"));
const album_controller_1 = require("./album.controller");
const auth_middleware_1 = __importDefault(require("../../../middleWares/auth.middleware"));
const rateLimiter_1 = require("../../../middleWares/rateLimiter");
const router = express_1.default.Router();
// POST /api/v1/album/add — 20/15min per user
router.post("/add", auth_middleware_1.default, rateLimiter_1.albumLimiter, album_controller_1.AlbumController.addPhoto);
// GET /api/v1/album
router.get("/", auth_middleware_1.default, album_controller_1.AlbumController.getMyAlbum);
// GET /api/v1/album/:userId
router.get("/:userId", auth_middleware_1.default, album_controller_1.AlbumController.getUserAlbum);
// PATCH /api/v1/album/:photoId — 20/15min per user
router.patch("/:photoId", auth_middleware_1.default, rateLimiter_1.albumLimiter, album_controller_1.AlbumController.updatePhoto);
// DELETE /api/v1/album/delete/:photoId — 20/15min per user
router.delete("/delete/:photoId", auth_middleware_1.default, rateLimiter_1.albumLimiter, album_controller_1.AlbumController.deletePhoto);
exports.AlbumRoutes = router;
