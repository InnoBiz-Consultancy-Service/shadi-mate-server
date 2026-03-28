"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Like = void 0;
const mongoose_1 = require("mongoose");
const likeSchema = new mongoose_1.Schema({
    fromUserId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    toUserId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, { timestamps: true });
likeSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true });
likeSchema.index({ toUserId: 1 });
exports.Like = (0, mongoose_1.model)("Like", likeSchema);
