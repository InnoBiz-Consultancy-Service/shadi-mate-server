"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProfileValidation = void 0;
const zod_1 = __importDefault(require("zod"));
exports.createProfileValidation = zod_1.default.object({
    body: zod_1.default.object({
        relation: zod_1.default.enum(["Father", "Mother", "Other"]),
        fatherOccupation: zod_1.default.string(),
        motherOccupation: zod_1.default.string(),
        address: zod_1.default.object({
            divisionId: zod_1.default.string(),
            districtId: zod_1.default.string(),
            thanaId: zod_1.default.string().optional(),
            details: zod_1.default.string(),
        }),
        education: zod_1.default.object({
            graduation: zod_1.default.object({
                variety: zod_1.default.enum(["Varsity", "Engineering", "Medical", "Graduate"]),
                department: zod_1.default.string(),
                institution: zod_1.default.string(),
                passingYear: zod_1.default.string(),
                universityId: zod_1.default.string().optional(),
                collegeName: zod_1.default.string().optional(),
            }),
        }),
        religion: zod_1.default.object({
            faith: zod_1.default.enum(["Islam", "Hinduism", "Buddhism", "Christianity", "Other"]),
            practiceLevel: zod_1.default.enum(["Practicing", "Regular", "Occasional", "Not Practicing"]),
            dailyLifeStyleSummary: zod_1.default.string(),
            habits: zod_1.default.array(zod_1.default.string()).optional(),
            religiousLifestyleDetails: zod_1.default.string(),
        }),
        aboutMe: zod_1.default.string(),
        personality: zod_1.default.enum(["Introvert", "Extrovert", "Ambivert"]),
        birthDate: zod_1.default.string().optional(),
        profession: zod_1.default.string().optional(),
        salaryRange: zod_1.default.string().optional(),
        economicalStatus: zod_1.default.string().optional(),
        height: zod_1.default.number().optional(),
        weight: zod_1.default.number().optional(),
        skinTone: zod_1.default.string().optional(),
    }),
});
