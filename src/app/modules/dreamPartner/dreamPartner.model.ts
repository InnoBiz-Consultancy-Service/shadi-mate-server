// models/dreamPartner.model.ts
import { Schema, model } from "mongoose";
import { EconomicalStatus, Habits } from "../profile/profile.interface";

const dreamPartnerPreferenceSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },

    practiceLevel: { 
        type: String, 
        enum: ["Practicing", "Regular", "Occasional", "Not Practicing"], 
        required: true 
    },

    economicalStatus: { 
        type: String, 
        enum: Object.values(EconomicalStatus), 
        required: true 
    },

    habits: { 
        type: [String], 
        enum: Object.values(Habits), 
        required: true 
    },
}, { timestamps: true });

export const DreamPartnerPreference = model("DreamPartnerPreference", dreamPartnerPreferenceSchema);