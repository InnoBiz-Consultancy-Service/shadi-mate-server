import { Schema, model } from "mongoose";
import { IAlbum } from "./album.interface";

const photoSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
    },
    caption: String,
  },
  { timestamps: true }
);

const albumSchema = new Schema<IAlbum>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    photos: [photoSchema],
  },
  { timestamps: true }
);

export const Album = model<IAlbum>("Album", albumSchema);