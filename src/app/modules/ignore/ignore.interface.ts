import { Document, Types } from "mongoose";

export interface IIgnore extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    ignoredUserId: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}