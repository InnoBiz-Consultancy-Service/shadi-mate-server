import { Schema, model } from "mongoose";
import { Gender, GuardianRelation } from "./profile.interface";

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
            required: true,
        },
        details: {
            type: String,
            required: true,
        },
    },
    { _id: false }
);

const profileSchema = new Schema(
    {
        gender: {
            type: String,
            enum: Object.values(Gender),
            required: true,
        },

        guardianContact: {
            type: String,
            required: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        relation: {
            type: String,
            enum: Object.values(GuardianRelation),
            required: true,
        },

        address: addressSchema,

        universityId: {
            type: Schema.Types.ObjectId,
            ref: "University",
        },

        collegeName: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

export const Profile = model("Profile", profileSchema);