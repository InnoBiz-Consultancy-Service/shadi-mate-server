import { Schema, model } from "mongoose";
import {
  Gender,
  GuardianRelation,
  Personality,
  EconomicalStatus,
  Habits,
} from "./profile.interface";

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
        required: true,
      },
      institution: {
        type: String,
        required: true,
      },
      passingYear: {
        type: String,
        required: true,
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
      required: true,
    },
    religiousLifestyleDetails: {
      type: String,
      required: true,
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

    // ─── Basic Info ─────────────────────────
    gender: {
      type: String,
      enum: Object.values(Gender),
      required: true,
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
      required: true,
    },

    // ─── Bio ─────────────────────────
    aboutMe: {
      type: String,
      required: true,
    },

    // ─── Physical (optional) ─────────────────────────
    height: Number,
    weight: Number,
    skinTone: String,

    // ─── Career ─────────────────────────
    profession: {
      type: String,
      required: true
    },
    salaryRange: String,
    economicalStatus: {
      type: String,
      enum: Object.values(EconomicalStatus),
    },

    // ─── Personality ─────────────────────────
    personality: {
      type: String,
      enum: Object.values(Personality),
      required: true,
    },

    // ─── Habits ─────────────────────────
    habits: {
      type: [String],
      enum: Object.values(Habits),
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Profile = model("Profile", profileSchema);