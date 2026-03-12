import bcrypt from "bcryptjs";
import { model, Schema } from "mongoose";
import { IOtp, IUser, IOtpUserData, TGender, TUserRole } from "./user.interface";

// ─── User Schema ─────────────────────────────────────────────────────────────

const UserSchema = new Schema<IUser>(
    {
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
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters"],
            select: false,
        },
        role: {
            type: String,
            enum: TUserRole,
            default: TUserRole.USER,
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
            enum: TGender,
            required: [true, "Gender is required"],
        },
    },
    { timestamps: true }
);


export const User = model<IUser>("User", UserSchema);

// ─── OTP Schema ──────────────────────────────────────────────────────────────

const OtpSchema = new Schema<IOtp>({
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
    userData: {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        password: { type: String, required: true }, // already hashed
        gender: { type: String, enum: TGender, required: true },
    },
});

export const Otp = model<IOtp>("Otp", OtpSchema);