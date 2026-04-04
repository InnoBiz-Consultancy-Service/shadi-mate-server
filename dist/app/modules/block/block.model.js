"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Block = void 0;
const mongoose_1 = require("mongoose");
const blockSchema = new mongoose_1.Schema({
    blockerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    blockedId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, { timestamps: true });
blockSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });
blockSchema.index({ blockerId: 1 });
blockSchema.index({ blockedId: 1 });
exports.Block = (0, mongoose_1.model)("Block", blockSchema);
