"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Profile = void 0;
const mongoose_1 = require("mongoose");
const profile_interface_1 = require("./profile.interface");
// ─── Address Schema ─────────────────────────
const addressSchema = new mongoose_1.Schema({
    divisionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Division",
        required: true,
    },
    districtId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "District",
        required: true,
    },
    thanaId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Thana",
    },
    details: {
        type: String,
    },
}, { _id: false });
// ─── Education Schema ─────────────────────────
const educationSchema = new mongoose_1.Schema({
    graduation: {
        variety: {
            type: String,
            enum: ["Varsity", "Engineering", "Medical", "Graduate"],
            required: true,
        },
        department: {
            type: String,
        },
        institution: {
            type: String,
        },
        passingYear: {
            type: String,
        },
        universityId: {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "University",
        },
        collegeName: {
            type: String,
        },
    },
}, { _id: false });
// ─── Religion Schema ─────────────────────────
const religionSchema = new mongoose_1.Schema({
    faith: {
        type: String,
        enum: ["Islam", "Hinduism", "Buddhism", "Christianity", "Other"],
        required: true,
    },
    sectOrCaste: String,
    practiceLevel: {
        type: String,
        enum: ["Practicing", "Regular", "Occasional", "Not Practicing"],
        required: true,
    },
    dailyLifeStyleSummary: {
        type: String,
    },
    religiousLifestyleDetails: {
        type: String,
    },
}, { _id: false });
// ─── Main Profile Schema ─────────────────────────
const profileSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    birthDate: {
        type: Date,
    },
    // ─── Family Info ─────────────────────────
    relation: {
        type: String,
        enum: Object.values(profile_interface_1.GuardianRelation),
    },
    fatherOccupation: {
        type: String,
    },
    motherOccupation: {
        type: String,
    },
    maritalStatus: {
        type: String,
        enum: ["Single", "Divorced", "Widowed"],
    },
    // ─── Address ─────────────────────────
    address: {
        type: addressSchema,
        required: true,
    },
    // ─── Education ─────────────────────────
    education: {
        type: educationSchema,
        required: true,
    },
    // ─── Religion ─────────────────────────
    religion: {
        type: religionSchema,
    },
    // ─── Bio ─────────────────────────
    aboutMe: {
        type: String,
    },
    // ─── Physical (optional) ─────────────────────────
    height: {
        type: String,
    },
    weight: Number,
    skinTone: String,
    // ─── Career ─────────────────────────
    profession: {
        type: String,
        required: true,
    },
    salaryRange: String,
    economicalStatus: {
        type: String,
        enum: Object.values(profile_interface_1.EconomicalStatus),
        required: true,
    },
    // ─── Personality ─────────────────────────
    personality: {
        type: String,
        required: true,
        enum: Object.values(profile_interface_1.Personality),
    },
    // ─── Habits ─────────────────────────
    habits: {
        type: [String],
        required: true,
        enum: Object.values(profile_interface_1.Habits),
    },
    image: String,
}, {
    timestamps: true,
});
exports.Profile = (0, mongoose_1.model)("Profile", profileSchema);
