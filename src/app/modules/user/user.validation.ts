import { z } from "zod";

// ─── Register ─────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
    body: z.object({
        name: z
            .string({ error: "Name is required" })
            .min(2, "Name must be at least 2 characters")
            .max(50, "Name must not exceed 50 characters"),

        email: z
            .string({ error: "Email is required" })
            .email("Please provide a valid email address"),

        phone: z
            .string({ error: "Phone number is required" })
            .regex(/^01[3-9]\d{8}$/, "Please provide a valid Bangladeshi phone number (e.g. 01700000000)"),

        password: z
            .string({ error: "Password is required" })
            .min(6, "Password must be at least 6 characters"),

        gender: z.enum(["male", "female", "other"], {
            error: "Gender must be male, female, or other",
        }),
    }),
});

// ─── Verify OTP ───────────────────────────────────────────────────────────────

export const verifyOtpSchema = z.object({
    body: z.object({
        phone: z
            .string({ error: "Phone number is required" })
            .regex(/^01[3-9]\d{8}$/, "Please provide a valid Bangladeshi phone number"),

        otp: z
            .string({ error: "OTP is required" })
            .length(6, "OTP must be exactly 6 digits")
            .regex(/^\d{6}$/, "OTP must contain only digits"),
    }),
});

// ─── Forget Password (New) ───────────────────────────────────────────────────
export const forgetPasswordSchema = z.object({
    body: z.object({
        identifier: z
            .string({ error: "Phone number or email is required" })
            .min(3, "Identifier must be at least 3 characters"),
        
        oldPassword: z
            .string({ error: "Current password is required" })
            .min(6, "Password must be at least 6 characters"),
        
        newPassword: z
            .string({ error: "New password is required" })
            .min(6, "New password must be at least 6 characters"),
        
        confirmPassword: z
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
export const loginSchema = z.object({
  body: z.object({
    identifier: z
      .string({ error: "Phone number or email is required" })
      .min(3, "Identifier must be at least 3 characters"),
    password: z
      .string({ error: "Password is required" })
      .min(6, "Password must be at least 6 characters"),
  }),
});

export type TRegisterInput = z.infer<typeof registerSchema>["body"];
export type TVerifyOtpInput = z.infer<typeof verifyOtpSchema>["body"];
export type TLoginInput = z.infer<typeof loginSchema>["body"];
export type TForgetPasswordInput = z.infer<typeof forgetPasswordSchema>["body"];
