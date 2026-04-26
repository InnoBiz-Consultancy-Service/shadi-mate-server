"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlbumService = void 0;
const AppError_1 = __importDefault(require("../../../helpers/AppError"));
const album_model_1 = require("./album.model");
const MAX_PHOTO = 10;
const emptyAlbum = (userId) => ({
    userId,
    photos: [],
});
// ───────────────── ADD PHOTO (SINGLE + MULTIPLE) ─────────────────
const addPhoto = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    let album = yield album_model_1.Album.findOne({ userId });
    if (!album) {
        album = yield album_model_1.Album.create({ userId, photos: [] });
    }
    // 🔐 ownership check
    if (album.userId.toString() !== userId.toString()) {
        throw new AppError_1.default(403, "Forbidden");
    }
    // MULTIPLE
    if (payload.photos && Array.isArray(payload.photos)) {
        if (album.photos.length + payload.photos.length > MAX_PHOTO) {
            throw new AppError_1.default(400, `Max ${MAX_PHOTO} photos allowed`);
        }
        album.photos.push(...payload.photos);
    }
    // SINGLE
    else if (payload.url) {
        if (album.photos.length >= MAX_PHOTO) {
            throw new AppError_1.default(400, `Max ${MAX_PHOTO} photos allowed`);
        }
        album.photos.push({
            url: payload.url,
            caption: payload.caption,
        });
    }
    else {
        throw new AppError_1.default(400, "Invalid payload");
    }
    yield album.save();
    return album;
});
// ───────────────── GET MY ALBUM ─────────────────
const getMyAlbum = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const album = yield album_model_1.Album.findOne({ userId }).lean();
    return album || emptyAlbum(userId);
});
// ───────────────── GET USER ALBUM ─────────────────
const getAlbumByUserId = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const album = yield album_model_1.Album.findOne({ userId }).lean();
    return album || emptyAlbum(userId);
});
// ───────────────── DELETE PHOTO ─────────────────
const deletePhoto = (userId, photoId) => __awaiter(void 0, void 0, void 0, function* () {
    const album = yield album_model_1.Album.findOne({ userId });
    if (!album)
        throw new AppError_1.default(404, "Album not found");
    // 🔐 ownership check
    if (album.userId.toString() !== userId.toString()) {
        throw new AppError_1.default(403, "Forbidden");
    }
    const before = album.photos.length;
    album.photos = album.photos.filter((p) => p._id.toString() !== photoId);
    if (before === album.photos.length) {
        throw new AppError_1.default(404, "Photo not found");
    }
    yield album.save();
    return album;
});
// ───────────────── UPDATE PHOTO ─────────────────
const updatePhoto = (userId, photoId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const album = yield album_model_1.Album.findOne({ userId });
    if (!album)
        throw new AppError_1.default(404, "Album not found");
    // 🔐 ownership check
    if (album.userId.toString() !== userId.toString()) {
        throw new AppError_1.default(403, "Forbidden");
    }
    const photo = album.photos.find((p) => p._id.toString() === photoId);
    if (!photo)
        throw new AppError_1.default(404, "Photo not found");
    if (payload.url) {
        if (!payload.url.startsWith("http")) {
            throw new AppError_1.default(400, "Invalid URL");
        }
        photo.url = payload.url;
    }
    if (payload.caption !== undefined) {
        photo.caption = payload.caption;
    }
    yield album.save();
    return album;
});
exports.AlbumService = {
    addPhoto,
    getMyAlbum,
    getAlbumByUserId,
    deletePhoto,
    updatePhoto,
};
