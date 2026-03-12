import { z } from "zod";

export const createProfileValidation = z.object({
    body: z.object({

        guardianContact: z.string(),

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
            details: z.string(),
        }),

        universityId: z.string().optional(),

        collegeName: z.string().optional(),
    }),
});