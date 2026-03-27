"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DreamPartnerPreference = void 0;
// models/dreamPartner.model.ts
const mongoose_1 = require("mongoose");
const profile_interface_1 = require("../profile/profile.interface");
const dreamPartnerPreferenceSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    practiceLevel: {
        type: String,
        enum: ["Practicing", "Regular", "Occasional", "Not Practicing"],
        required: true
    },
    economicalStatus: {
        type: String,
        enum: Object.values(profile_interface_1.EconomicalStatus),
        required: true
    },
    habits: {
        type: [String],
        enum: Object.values(profile_interface_1.Habits),
        required: true
    },
}, { timestamps: true });
exports.DreamPartnerPreference = (0, mongoose_1.model)("DreamPartnerPreference", dreamPartnerPreferenceSchema);
