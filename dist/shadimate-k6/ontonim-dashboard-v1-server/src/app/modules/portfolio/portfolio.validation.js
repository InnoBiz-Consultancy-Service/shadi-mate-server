"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProjectValidationSchema = exports.createProjectValidationSchema = void 0;
const zod_1 = require("zod");
// Create Project Validation
exports.createProjectValidationSchema = zod_1.z.object({
    title: zod_1.z
        .string()
        .min(1, "Title cannot be empty")
        .max(200, "Title cannot exceed 200 characters")
        .refine((val) => val.trim().length > 0, {
        message: "Title cannot be empty"
    }),
    description: zod_1.z
        .string()
        .min(10, "Description must be at least 10 characters long")
        .max(2000, "Description cannot exceed 2000 characters")
        .refine((val) => val.trim().length >= 10, {
        message: "Description must be at least 10 characters long"
    }),
    technologies: zod_1.z
        .array(zod_1.z.string().refine((val) => val.trim().length > 0, {
        message: "Technology names cannot be empty"
    }))
        .min(1, "At least one technology is required"),
    services: zod_1.z
        .array(zod_1.z.string().refine((val) => val.trim().length > 0, {
        message: "Service names cannot be empty"
    }))
        .min(1, "At least one service is required"),
    liveURL: zod_1.z
        .string()
        .url("Live URL must be a valid URL"),
    caseStudyURL: zod_1.z
        .string()
        .url("Case study URL must be a valid URL")
        .optional()
        .or(zod_1.z.literal("")),
    imageURL: zod_1.z
        .string()
        .url("Image URL must be a valid URL")
});
// Update Project Validation
exports.updateProjectValidationSchema = zod_1.z.object({
    title: zod_1.z
        .string()
        .min(1, { message: "Title cannot be empty" })
        .max(200, { message: "Title cannot exceed 200 characters" })
        .trim()
        .optional(),
    description: zod_1.z
        .string()
        .min(10, { message: "Description must be at least 10 characters long" })
        .max(2000, { message: "Description cannot exceed 2000 characters" })
        .trim()
        .optional(),
    technologies: zod_1.z
        .array(zod_1.z.string().trim())
        .min(1, { message: "At least one technology is required" })
        .refine((arr) => arr.every((item) => item.length > 0), {
        message: "Technology names cannot be empty"
    })
        .optional(),
    services: zod_1.z
        .array(zod_1.z.string().trim())
        .min(1, { message: "At least one service is required" })
        .refine((arr) => arr.every((item) => item.length > 0), {
        message: "Service names cannot be empty"
    })
        .optional(),
    liveURL: zod_1.z
        .string()
        .url({ message: "Live URL must be a valid URL" })
        .trim()
        .optional(),
    caseStudyURL: zod_1.z
        .string()
        .url({ message: "Case study URL must be a valid URL" })
        .trim()
        .optional()
        .or(zod_1.z.literal("")),
    imageURL: zod_1.z
        .string()
        .url({ message: "Image URL must be a valid URL" })
        .trim()
        .optional()
});
