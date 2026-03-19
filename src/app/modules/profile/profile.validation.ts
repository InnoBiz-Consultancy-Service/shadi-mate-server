import { z } from "zod";

export const createProfileValidation = z.object({
    body: z.object({

        fatherOccupation: z.string().optional(),
        motherOccupation: z.string().optional(),


        relation: z.enum([
            "father",
            "mother",
            "brother",
            "sister",
            "uncle",
            "aunt",
            "guardian",
        ]),

        address: z.object({
            divisionId: z.string(),
            districtId: z.string(),
            thanaId: z.string(),
            details: z.string().optional(),
        }),

        universityId: z.string().optional(),

        collegeName: z.string().optional(),

        BirthDate: z.string().optional(),
        economicalStatus: z.string().optional(),
        profession: z.string().optional(),
    }),
});