import { Document, Types } from "mongoose";

export interface ILike extends Document {
    _id: Types.ObjectId;
    fromUserId: Types.ObjectId;
    toUserId: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}