"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DreamPartnerPreference = void 0;
const mongoose_1 = require("mongoose");
// ─── Dream Partner Preference Schema ─────────────────────────
const dreamPartnerPreferenceSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    // Existing fields
    practiceLevel: {
        type: String,
        enum: ["Practicing", "Regular", "Occasional", "Not Practicing"],
    },
    economicalStatus: {
        type: String,
        enum: ["Low", "Middle", "Upper-Middle", "High"],
    },
    habits: [{
            type: String,
        }],
    // NEW: 3 fields added
    agePreference: {
        min: Number,
        max: Number,
    },
    locationPreference: {
        divisionId: {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Division",
        },
        districtId: {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "District",
        },
        thanaId: {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Thana",
        },
    },
    heightPreference: {
        min: String,
        max: String,
    },
}, {
    timestamps: true,
});
// Indexes for better performance
dreamPartnerPreferenceSchema.index({ userId: 1 });
dreamPartnerPreferenceSchema.index({ "agePreference.min": 1, "agePreference.max": 1 });
dreamPartnerPreferenceSchema.index({ "locationPreference.divisionId": 1 });
dreamPartnerPreferenceSchema.index({ "locationPreference.districtId": 1 });
exports.DreamPartnerPreference = (0, mongoose_1.model)("DreamPartnerPreference", dreamPartnerPreferenceSchema);
