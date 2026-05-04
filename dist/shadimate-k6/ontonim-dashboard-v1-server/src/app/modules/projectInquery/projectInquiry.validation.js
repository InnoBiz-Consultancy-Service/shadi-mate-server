"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectInquiryValidationSchema = void 0;
const zod_1 = require("zod");
exports.projectInquiryValidationSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(2, "Name must be at least 2 characters long")
        .max(100, "Name cannot exceed 100 characters")
        .regex(/^[a-zA-Z\s.'-]+$/, "Name must contain only valid characters"),
    email: zod_1.z
        .string()
        .email("Invalid email address"),
    subject: zod_1.z
        .string()
        .min(1, "Subject cannot be empty")
        .max(200, "Subject cannot exceed 200 characters"),
    projectType: zod_1.z
        .string()
        .min(1, "Project type cannot be empty"),
    budgetRange: zod_1.z.string().optional(),
    message: zod_1.z
        .string()
        .min(10, "Message must be at least 10 characters long")
        .max(2000, "Message cannot exceed 2000 characters"),
});
