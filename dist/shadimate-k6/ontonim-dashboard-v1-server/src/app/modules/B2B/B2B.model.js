"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartnershipRequest = void 0;
const mongoose_1 = require("mongoose");
const partnershipRequestSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        minlength: [2, "Name must be at least 2 characters long"],
        maxlength: [100, "Name cannot exceed 100 characters"]
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        lowercase: true,
        trim: true,
        match: [
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            "Please provide a valid email address"
        ]
    },
    companyName: {
        type: String,
        required: [true, "Company name is required"],
        trim: true,
        minlength: [2, "Company name must be at least 2 characters long"],
        maxlength: [200, "Company name cannot exceed 200 characters"]
    },
    partnershipType: {
        type: String,
        required: [true, "Partnership type is required"],
        trim: true
    },
    partnershipDetails: {
        type: String,
        required: [true, "Partnership details are required"],
        trim: true,
        minlength: [
            20,
            "Partnership details must be at least 20 characters long"
        ],
        maxlength: [3000, "Partnership details cannot exceed 3000 characters"]
    },
    status: {
        type: String,
        enum: ["pending", "under_review", "approved", "rejected"],
        default: "pending"
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    versionKey: false
});
// Index for faster queries
partnershipRequestSchema.index({ email: 1, companyName: 1, createdAt: -1 });
exports.PartnershipRequest = (0, mongoose_1.model)("PartnershipRequest", partnershipRequestSchema);
