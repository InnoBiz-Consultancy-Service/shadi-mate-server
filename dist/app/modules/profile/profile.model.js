"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Profile = void 0;
const mongoose_1 = require("mongoose");
const profile_interface_1 = require("./profile.interface");
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
        required: true,
    },
    details: {
        type: String,
        required: true,
    },
}, { _id: false });
const profileSchema = new mongoose_1.Schema({
    gender: {
        type: String,
        enum: Object.values(profile_interface_1.Gender),
        required: true,
    },
    guardianContact: {
        type: String,
        required: true,
    },
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    relation: {
        type: String,
        enum: Object.values(profile_interface_1.GuardianRelation),
        required: true,
    },
    address: addressSchema,
    universityId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "University",
    },
    collegeName: {
        type: String,
    },
}, {
    timestamps: true,
});
exports.Profile = (0, mongoose_1.model)("Profile", profileSchema);
