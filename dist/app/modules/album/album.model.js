"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Album = void 0;
const mongoose_1 = require("mongoose");
const photoSchema = new mongoose_1.Schema({
    url: {
        type: String,
        required: true,
    },
    caption: String,
}, { timestamps: true });
const albumSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    photos: [photoSchema],
}, { timestamps: true });
exports.Album = (0, mongoose_1.model)("Album", albumSchema);
