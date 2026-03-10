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

// Hash password before saving
UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

export const User = model<IUser>("User", UserSchema);

// ─── OTP Schema ──────────────────────────────────────────────────────────────

const OtpSchema = new Schema<IOtp>({
    phone: {
        type: String,
        required: true,
        unique: true, // একটা phone এ একটাই pending OTP doc
    },
    otp: {
        type: String,
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 }, // TTL: MongoDB auto-deletes when expiresAt passes
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