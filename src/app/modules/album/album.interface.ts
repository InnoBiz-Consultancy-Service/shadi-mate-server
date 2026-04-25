import { Types } from "mongoose";

export interface IPhoto {
  _id?: Types.ObjectId;
  url: string;
  caption?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAlbum {
  userId: Types.ObjectId;
  photos: IPhoto[];
  createdAt?: Date;
  updatedAt?: Date;
}