import { Document, Types } from "mongoose";

// ─── User ────────────────────────────────────────────────────────────────────

export enum TUserRole {
    USER = "user",
    ADMIN = "admin",
}
export enum TGender {
    MALE = "male",
    FEMALE = "female",
    OTHER = "other",
}

export interface IUser extends Document {
    _id: Types.ObjectId;
    name: string;
    email: string;
    phone: string;
    password: string;
    gender: TGender;
    role: TUserRole;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    isBlocked: boolean;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

// ─── OTP ─────────────────────────────────────────────────────────────────────

export interface IOtpUserData {
    name: string;
    email: string;
    phone: string;
    password: string; // already hashed
    gender: TGender;
}

export interface IOtp extends Document {
    phone: string;
    otp: string;
    expiresAt: Date;
    userData: IOtpUserData;
}