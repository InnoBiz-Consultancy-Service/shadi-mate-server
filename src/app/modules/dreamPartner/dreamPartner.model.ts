import { Schema, model } from "mongoose";

// ─── Dream Partner Preference Schema ─────────────────────────
const dreamPartnerPreferenceSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    
    // Existing fields
    practiceLevel: {
      type: String,
      enum: ["Practicing", "Regular", "Occasional", "Not Practicing"],
    },
    economicalStatus: {
      type: String,
      enum: ["Low", "Middle", "Upper-Middle", "High"],
    },
    habits: [{
      type: String,
    }],
    
    // NEW: 3 fields added
    agePreference: {
      min: Number,
      max: Number,
    },
    
    locationPreference: {
      divisionId: {
        type: Schema.Types.ObjectId,
        ref: "Division",
      },
      districtId: {
        type: Schema.Types.ObjectId,
        ref: "District",
      },
      thanaId: {
        type: Schema.Types.ObjectId,
        ref: "Thana",
      },
    },
    
    heightPreference: {
      min: String,
      max: String,
    },
  },
  {
    timestamps: true,
  }
);
// Indexes for better performance
dreamPartnerPreferenceSchema.index({ userId: 1 });
dreamPartnerPreferenceSchema.index({ "agePreference.min": 1, "agePreference.max": 1 });
dreamPartnerPreferenceSchema.index({ "locationPreference.divisionId": 1 });
dreamPartnerPreferenceSchema.index({ "locationPreference.districtId": 1 });

export const DreamPartnerPreference = model("DreamPartnerPreference", dreamPartnerPreferenceSchema);