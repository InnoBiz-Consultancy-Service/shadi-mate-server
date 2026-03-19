"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProfileValidation = void 0;
const zod_1 = require("zod");
exports.createProfileValidation = zod_1.z.object({
    body: zod_1.z.object({
        fatherOccupation: zod_1.z.string().optional(),
        motherOccupation: zod_1.z.string().optional(),
        relation: zod_1.z.enum([
            "father",
            "mother",
            "brother",
            "sister",
            "uncle",
            "aunt",
            "guardian",
        ]),
        address: zod_1.z.object({
            divisionId: zod_1.z.string(),
            districtId: zod_1.z.string(),
            thanaId: zod_1.z.string(),
            details: zod_1.z.string().optional(),
        }),
        universityId: zod_1.z.string().optional(),
        collegeName: zod_1.z.string().optional(),
        BirthDate: zod_1.z.string().optional(),
        economicalStatus: zod_1.z.string().optional(),
        profession: zod_1.z.string().optional(),
    }),
});
