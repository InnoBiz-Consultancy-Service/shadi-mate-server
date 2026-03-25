import z from "zod";

export const createProfileValidation = z.object({
  body: z.object({
    relation: z.enum(["Father", "Mother", "Other"]),

    fatherOccupation: z.string(),
    motherOccupation: z.string(),

    address: z.object({
      divisionId: z.string(),
      districtId: z.string(),
      thanaId: z.string().optional(),
      details: z.string(),
    }),

    education: z.object({
      graduation: z.object({
        variety: z.enum(["Varsity", "Engineering", "Medical", "Graduate"]),
        department: z.string(),
        institution: z.string(),
        passingYear: z.string(),
        universityId: z.string().optional(),
        collegeName: z.string().optional(),
      }),
    }),

    religion: z.object({
      faith: z.enum(["Islam", "Hinduism", "Buddhism", "Christianity", "Other"]),
      practiceLevel: z.enum(["Practicing", "Regular", "Occasional", "Not Practicing"]),
      dailyLifeStyleSummary: z.string(),
      habits: z.array(z.string()).optional(),
      religiousLifestyleDetails: z.string(),
    }),

    aboutMe: z.string(),

    personality: z.enum(["Introvert", "Extrovert", "Ambivert"]),

    birthDate: z.string().optional(),

    profession: z.string().optional(),
    salaryRange: z.string().optional(),
    economicalStatus: z.string().optional(),

    height: z.number().optional(),
    weight: z.number().optional(),
    skinTone: z.string().optional(),
  }),
});