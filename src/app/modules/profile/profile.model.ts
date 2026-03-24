import { Schema, model } from "mongoose";
import { GuardianRelation, Personality } from "./profile.interface";

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

const profileSchema = new Schema(
    {


    fatherOccupation: {
        type: String,
    },
    motherOccupation: {
        type: String,
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
        personalityTestResult: {
            type: Schema.Types.ObjectId,
            ref: "GuestTestResult",
        },
       
        personality: {
            type: String,
            enum: Object.values(Personality),
        },
        BirthDate: {
            type: Date,
        },
        economicalStatus: {
            type: String,
        },
        salaryRange: {
            type: String,
        },
        profession: {
            type: String,
        },

    },
    {
        timestamps: true,
    }
);

export const Profile = model("Profile", profileSchema);