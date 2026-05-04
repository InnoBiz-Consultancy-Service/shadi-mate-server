"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.partnershipRequestValidationSchema = void 0;
const zod_1 = require("zod");
exports.partnershipRequestValidationSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(2, "Name must be at least 2 characters long")
        .max(100, "Name cannot exceed 100 characters")
        .trim()
        .refine((val) => /^[a-zA-Z\s.'-]+$/.test(val), {
        message: "Name must contain only valid characters"
    }),
    email: zod_1.z
        .string()
        .email("Invalid email address")
        .transform((val) => val.toLowerCase().trim()),
    companyName: zod_1.z
        .string()
        .min(2, "Company name must be at least 2 characters long")
        .max(200, "Company name cannot exceed 200 characters")
        .trim(),
    partnershipType: zod_1.z
        .string()
        .min(1, "Partnership type cannot be empty")
        .trim(),
    partnershipDetails: zod_1.z
        .string()
        .min(20, "Partnership details must be at least 20 characters long")
        .max(3000, "Partnership details cannot exceed 3000 characters")
        .trim()
});
