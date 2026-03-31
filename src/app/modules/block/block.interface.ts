import { Document, Types } from "mongoose";

export interface IBlock extends Document {
    _id: Types.ObjectId;
    blockerId: Types.ObjectId;
    blockedId: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}