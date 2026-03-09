"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cache = void 0;
const mongoose_1 = require("mongoose");
const cacheSchema = new mongoose_1.Schema({
    key: String,
    data: mongoose_1.Schema.Types.Mixed,
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600,
    },
});
exports.Cache = (0, mongoose_1.model)("Cache", cacheSchema);
