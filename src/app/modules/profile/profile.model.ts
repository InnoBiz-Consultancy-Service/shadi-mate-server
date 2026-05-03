import { Schema, model } from "mongoose";
import {
  Gender,
  GuardianRelation,
  Personality,
  EconomicalStatus,
  Habits,
} from "./profile.interface";
import { string } from "zod";

// ─── Address Schema ─────────────────────────
const addressSchema = new Schema(
  {
    divisionId: {
      type: Schema.Types.ObjectId,
      ref: "Division",
      required: true,
    },
    districtId: {
      type: Schema.Types.ObjectId,
      ref: "District",
      required: true,
    },
    thanaId: {
      type: Schema.Types.ObjectId,
      ref: "Thana",
    },
    details: {
      type: String,
    },
  },
  { _id: false }
);

// ─── Education Schema ─────────────────────────
const educationSchema = new Schema(
  {
    graduation: {
      variety: {
        type: String,
        enum: ["Varsity", "Engineering", "Medical", "Graduate"],
        required: true,
      },
      department: {
        type: String,
      },
      institution: {
        type: String,
      },
      passingYear: {
        type: String,
      },
      universityId: {
        type: Schema.Types.ObjectId,
        ref: "University",
      },
      collegeName: {
        type: String,
      },
    },
  },
  { _id: false }
);

// ─── Religion Schema ─────────────────────────
const religionSchema = new Schema(
  {
    faith: {
      type: String,
      enum: ["Islam", "Hinduism", "Buddhism", "Christianity", "Other"],
      required: true,
    },
    sectOrCaste: String,
    practiceLevel: {
      type: String,
      enum: ["Practicing", "Regular", "Occasional", "Not Practicing"],
      required: true,
    },
    dailyLifeStyleSummary: {
      type: String,
    },
    religiousLifestyleDetails: {
      type: String,
    },
  },
  { _id: false }
);


// ─── Main Profile Schema ─────────────────────────
const profileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    
    birthDate: {
      type: Date,
    },

    // ─── Family Info ─────────────────────────
    relation: {
      type: String,
      enum: Object.values(GuardianRelation),
    },
    fatherOccupation: {
      type: String,
    },
    motherOccupation: {
      type: String,
    },
    maritalStatus: {
      type: String,
      enum: ["Single", "Divorced", "Widowed"],
    },
    // ─── Address ─────────────────────────
    address: {
      type: addressSchema,
      required: true,
    },

    // ─── Education ─────────────────────────
    education: {
      type: educationSchema,
      required: true,
    },

    // ─── Religion ─────────────────────────
    religion: {
      type: religionSchema,
    },

    // ─── Bio ─────────────────────────
    aboutMe: {
      type: String,
    },

    // ─── Physical (optional) ─────────────────────────
    height:{
      type: String,
    },
    weight: Number,
    skinTone: String,

    // ─── Career ─────────────────────────
    profession: {
      type: String,
      required: true,
    },
    salaryRange: String,
    economicalStatus: {
      type: String,
      enum: Object.values(EconomicalStatus),
      required: true,
    },

    // ─── Personality ─────────────────────────
    personality: {
      type: String,
      required: true,
      enum: Object.values(Personality),
    },

    // ─── Habits ─────────────────────────
    habits: {
      type: [String],
      required: true,
      enum: Object.values(Habits),
    },
    image: String,
  },
  {
    timestamps: true,
  }
);

export const Profile = model("Profile", profileSchema);