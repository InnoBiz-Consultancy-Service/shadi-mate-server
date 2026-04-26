"use strict";
// album.route.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlbumRoutes = void 0;
const express_1 = __importDefault(require("express"));
const album_controller_1 = require("./album.controller");
const auth_middleware_1 = __importDefault(require("../../../middleWares/auth.middleware"));
const router = express_1.default.Router();
router.post("/add", auth_middleware_1.default, album_controller_1.AlbumController.addPhoto);
router.get("/", auth_middleware_1.default, album_controller_1.AlbumController.getMyAlbum);
router.get("/:userId", auth_middleware_1.default, album_controller_1.AlbumController.getUserAlbum);
router.patch("/:photoId", auth_middleware_1.default, album_controller_1.AlbumController.updatePhoto);
router.delete("/delete/:photoId", auth_middleware_1.default, album_controller_1.AlbumController.deletePhoto);
exports.AlbumRoutes = router;
