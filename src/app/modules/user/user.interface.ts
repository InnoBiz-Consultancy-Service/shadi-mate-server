import { Document, Types } from "mongoose";

// ─── User ────────────────────────────────────────────────────────────────────

export type TUserRole = "user" | "admin";

export interface IUser extends Document {
    _id: Types.ObjectId;
    name: string;
    email: string;
    phone: string;
    password: string;
    role: TUserRole;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    isBlocked: boolean;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

// ─── OTP ─────────────────────────────────────────────────────────────────────

export interface IOtp extends Document {
    phone: string;
    otp: string;
    expiresAt: Date;
}