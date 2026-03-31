import { Schema, model } from "mongoose";
import { IBlock } from "./block.interface";

const blockSchema = new Schema<IBlock>(
    {
        blockerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        blockedId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

blockSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });

blockSchema.index({ blockerId: 1 });
blockSchema.index({ blockedId: 1 });

export const Block = model<IBlock>("Block", blockSchema);