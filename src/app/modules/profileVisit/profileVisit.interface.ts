import { Document, Types } from "mongoose";

export interface IProfileVisit extends Document {
    _id: Types.ObjectId;
    visitorId: Types.ObjectId;
    profileOwnerId: Types.ObjectId;
    visitCount: number;
    visitedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}