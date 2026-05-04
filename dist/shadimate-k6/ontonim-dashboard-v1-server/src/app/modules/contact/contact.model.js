"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactRequest = void 0;
const mongoose_1 = require("mongoose");
const contactRequestSchema = new mongoose_1.Schema({
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
    phone: {
        type: String,
        required: [true, "Phone number is required"],
        trim: true
    },
    message: {
        type: String,
        required: [true, "Message is required"],
        trim: true,
        minlength: [10, "Message must be at least 10 characters long"],
        maxlength: [2000, "Message cannot exceed 2000 characters"]
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    versionKey: false
});
// Index for faster queries on common search fields
contactRequestSchema.index({ email: 1, createdAt: -1 });
exports.ContactRequest = (0, mongoose_1.model)("ContactRequest", contactRequestSchema);
