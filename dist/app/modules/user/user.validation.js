"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.forgetPasswordSchema = exports.verifyOtpSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
// ─── Register ─────────────────────────────────────────────────────────────────
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z
            .string({ error: "Name is required" })
            .min(2, "Name must be at least 2 characters")
            .max(50, "Name must not exceed 50 characters"),
        email: zod_1.z
            .string({ error: "Email is required" })
            .email("Please provide a valid email address"),
        phone: zod_1.z
            .string({ error: "Phone number is required" })
            .regex(/^01[3-9]\d{8}$/, "Please provide a valid Bangladeshi phone number (e.g. 01700000000)"),
        password: zod_1.z
            .string({ error: "Password is required" })
            .min(6, "Password must be at least 6 characters"),
        gender: zod_1.z.enum(["male", "female", "other"], {
            error: "Gender must be male, female, or other",
        }),
    }),
});
// ─── Verify OTP ───────────────────────────────────────────────────────────────
exports.verifyOtpSchema = zod_1.z.object({
    body: zod_1.z.object({
        phone: zod_1.z
            .string({ error: "Phone number is required" })
            .regex(/^01[3-9]\d{8}$/, "Please provide a valid Bangladeshi phone number"),
        otp: zod_1.z
            .string({ error: "OTP is required" })
            .length(6, "OTP must be exactly 6 digits")
            .regex(/^\d{6}$/, "OTP must contain only digits"),
    }),
});
// ─── Forget Password (New) ───────────────────────────────────────────────────
exports.forgetPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        identifier: zod_1.z
            .string({ error: "Phone number or email is required" })
            .min(3, "Identifier must be at least 3 characters"),
        oldPassword: zod_1.z
            .string({ error: "Current password is required" })
            .min(6, "Password must be at least 6 characters"),
        newPassword: zod_1.z
            .string({ error: "New password is required" })
            .min(6, "New password must be at least 6 characters"),
        confirmPassword: zod_1.z
            .string({ error: "Please confirm your new password" })
            .min(6, "Confirm password must be at least 6 characters"),
    }).refine((data) => data.newPassword === data.confirmPassword, {
        message: "New password and confirm password do not match",
        path: ["confirmPassword"],
    }).refine((data) => data.oldPassword !== data.newPassword, {
        message: "New password must be different from old password",
        path: ["newPassword"],
    }),
});
// ─── Login ────────────────────────────────────────────────────────────────────
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        identifier: zod_1.z
            .string({ error: "Phone number or email is required" })
            .min(3, "Identifier must be at least 3 characters"),
        password: zod_1.z
            .string({ error: "Password is required" })
            .min(6, "Password must be at least 6 characters"),
    }),
});
