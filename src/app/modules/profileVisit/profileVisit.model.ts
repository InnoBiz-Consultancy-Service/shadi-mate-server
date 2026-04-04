import { Schema, model } from "mongoose";
import { IProfileVisit } from "./profileVisit.interface";

const profileVisitSchema = new Schema<IProfileVisit>(
    {
        visitorId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        profileOwnerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        visitCount: {
            type: Number,
            default: 1,
        },
        visitedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

profileVisitSchema.index({ visitorId: 1, profileOwnerId: 1 }, { unique: true });

profileVisitSchema.index({ profileOwnerId: 1, visitedAt: -1 });

export const ProfileVisit = model<IProfileVisit>("ProfileVisit", profileVisitSchema);