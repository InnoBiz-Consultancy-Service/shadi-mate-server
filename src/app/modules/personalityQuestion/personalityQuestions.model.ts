import mongoose from "mongoose";

const optionSchema = new mongoose.Schema(
    {
        label: {
            type: String,
            enum: ["agree", "sometimes", "disagree"],
            required: true
        },
        text: {
            type: String,
            required: true
        },
        score: {
            type: Number,
            required: true
        }
    },
    { _id: false }
);

const personalityQuestionSchema = new mongoose.Schema(
    {
        text: {
            type: String,
            required: true
        },

        order: {
            type: Number,
            required: true
        },

        options: [optionSchema]
    },
    { timestamps: true }
);

export const PersonalityQuestion = mongoose.model(
    "PersonalityQuestion",
    personalityQuestionSchema
);


const guestTestResultSchema = new mongoose.Schema(
    {
        name: String,
        email: String,
        gender: String,
        matchIds: [mongoose.Schema.Types.ObjectId],

        answers: [
            {
                questionId: mongoose.Schema.Types.ObjectId,
                selectedOption: {
                    type: String,
                    enum: ["agree", "sometimes", "disagree"]
                }
            }
        ],

    
        type: String
    },
    { timestamps: true }
);

export const GuestTestResult = mongoose.model(
    "GuestTestResult",
    guestTestResultSchema
);