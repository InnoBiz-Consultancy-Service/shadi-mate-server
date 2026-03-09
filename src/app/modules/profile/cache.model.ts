import { Schema, model } from "mongoose";

const cacheSchema = new Schema({
    key: String,

    data: Schema.Types.Mixed,

    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600,
    },
});

export const Cache = model("Cache", cacheSchema);