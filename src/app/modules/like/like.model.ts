import { Schema, model } from "mongoose";
import { ILike } from "./like.interface";

const likeSchema = new Schema<ILike>(
    {
        fromUserId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        toUserId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

likeSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true });

likeSchema.index({ toUserId: 1 });

export const Like = model<ILike>("Like", likeSchema);