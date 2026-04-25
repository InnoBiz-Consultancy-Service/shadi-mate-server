import { Request, Response } from "express";
import { AlbumService } from "./album.service";
import { catchAsync } from "../../../utils/catchAsync";
import { sendResponse } from "../../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";

const addPhoto = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  const result = await AlbumService.addPhoto(userId, req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Photo(s) added successfully",
    data: result,
  });
});

const getMyAlbum = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  const result = await AlbumService.getMyAlbum(userId);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "My album fetched",
    data: result,
  });
});

const getUserAlbum = catchAsync(async (req: Request, res: Response) => {
  const result = await AlbumService.getAlbumByUserId(req.params.userId);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "User album fetched",
    data: result,
  });
});

const deletePhoto = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  const result = await AlbumService.deletePhoto(
    userId,
    req.params.photoId
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Photo deleted",
    data: result,
  });
});

const updatePhoto = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  const result = await AlbumService.updatePhoto(
    userId,
    req.params.photoId,
    req.body
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Photo updated",
    data: result,
  });
});

export const AlbumController = {
  addPhoto,
  getMyAlbum,
  getUserAlbum,
  deletePhoto,
  updatePhoto,
};