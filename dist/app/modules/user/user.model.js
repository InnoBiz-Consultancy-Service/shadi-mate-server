"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Otp = exports.User = void 0;
const mongoose_1 = require("mongoose");
const user_interface_1 = require("./user.interface");
// ─── User Schema ─────────────────────────────────────────
const UserSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
    },
    phone: {
        type: String,
        required: [true, "Phone number is required"],
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    role: {
        type: String,
        enum: user_interface_1.TUserRole,
        default: user_interface_1.TUserRole.USER,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    isProfileCompleted: {
        type: Boolean,
        default: false,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    isBlocked: {
        type: Boolean,
        default: false,
    },
    gender: {
        type: String,
        enum: user_interface_1.TGender,
    },
}, { timestamps: true });
exports.User = (0, mongoose_1.model)("User", UserSchema);
// ─── OTP Schema ─────────────────────────────────────────
const OtpSchema = new mongoose_1.Schema({
    phone: {
        type: String,
        required: true,
        unique: true,
    },
    otp: {
        type: String,
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 },
    },
    purpose: {
        type: String,
        enum: ["registration", "forgot-password"],
        default: "registration",
    },
    userData: {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        password: { type: String, required: true },
        gender: { type: String, enum: user_interface_1.TGender, required: true },
    },
});
exports.Otp = (0, mongoose_1.model)("Otp", OtpSchema);
