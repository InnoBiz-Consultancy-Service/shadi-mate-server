"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileVisit = void 0;
const mongoose_1 = require("mongoose");
const profileVisitSchema = new mongoose_1.Schema({
    visitorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    profileOwnerId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, { timestamps: true });
profileVisitSchema.index({ visitorId: 1, profileOwnerId: 1 }, { unique: true });
profileVisitSchema.index({ profileOwnerId: 1, visitedAt: -1 });
exports.ProfileVisit = (0, mongoose_1.model)("ProfileVisit", profileVisitSchema);
