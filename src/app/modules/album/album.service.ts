import AppError from "../../../helpers/AppError";
import { Album } from "./album.model";
import { StatusCodes } from "http-status-codes";

const MAX_PHOTO = 10;

const emptyAlbum = (userId: string) => ({
  userId,
  photos: [],
});

// ───────────────── ADD PHOTO (SINGLE + MULTIPLE) ─────────────────
const addPhoto = async (userId: string, payload: any) => {
  let album = await Album.findOne({ userId });

  if (!album) {
    album = await Album.create({ userId, photos: [] });
  }

  // 🔐 ownership check
  if (album.userId.toString() !== userId.toString()) {
    throw new AppError(403, "Forbidden");
  }

  // MULTIPLE
  if (payload.photos && Array.isArray(payload.photos)) {
    if (album.photos.length + payload.photos.length > MAX_PHOTO) {
      throw new AppError(400, `Max ${MAX_PHOTO} photos allowed`);
    }

    album.photos.push(...payload.photos);
  }

  // SINGLE
  else if (payload.url) {
    if (album.photos.length >= MAX_PHOTO) {
      throw new AppError(400, `Max ${MAX_PHOTO} photos allowed`);
    }

    album.photos.push({
      url: payload.url,
      caption: payload.caption,
    } as any);
  } else {
    throw new AppError(400, "Invalid payload");
  }

  await album.save();
  return album;
};

// ───────────────── GET MY ALBUM ─────────────────
const getMyAlbum = async (userId: string) => {
  const album = await Album.findOne({ userId }).lean();
  return album || emptyAlbum(userId);
};

// ───────────────── GET USER ALBUM ─────────────────
const getAlbumByUserId = async (userId: string) => {
  const album = await Album.findOne({ userId }).lean();
  return album || emptyAlbum(userId);
};

// ───────────────── DELETE PHOTO ─────────────────
const deletePhoto = async (userId: string, photoId: string) => {
  const album = await Album.findOne({ userId });

  if (!album) throw new AppError(404, "Album not found");

  // 🔐 ownership check
  if (album.userId.toString() !== userId.toString()) {
    throw new AppError(403, "Forbidden");
  }

  const before = album.photos.length;

  album.photos = album.photos.filter(
    (p: any) => p._id.toString() !== photoId
  );

  if (before === album.photos.length) {
    throw new AppError(404, "Photo not found");
  }

  await album.save();
  return album;
};

// ───────────────── UPDATE PHOTO ─────────────────
const updatePhoto = async (
  userId: string,
  photoId: string,
  payload: { url?: string; caption?: string }
) => {
  const album = await Album.findOne({ userId });

  if (!album) throw new AppError(404, "Album not found");

  // 🔐 ownership check
  if (album.userId.toString() !== userId.toString()) {
    throw new AppError(403, "Forbidden");
  }

  const photo = album.photos.find(
    (p: any) => p._id.toString() === photoId
  );

  if (!photo) throw new AppError(404, "Photo not found");

  if (payload.url) {
    if (!payload.url.startsWith("http")) {
      throw new AppError(400, "Invalid URL");
    }
    photo.url = payload.url;
  }

  if (payload.caption !== undefined) {
    photo.caption = payload.caption;
  }

  await album.save();
  return album;
};

export const AlbumService = {
  addPhoto,
  getMyAlbum,
  getAlbumByUserId,
  deletePhoto,
  updatePhoto,
};