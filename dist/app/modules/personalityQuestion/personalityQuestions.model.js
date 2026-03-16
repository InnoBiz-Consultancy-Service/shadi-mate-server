"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuestTestResult = exports.PersonalityQuestion = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const optionSchema = new mongoose_1.default.Schema({
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
}, { _id: false });
const personalityQuestionSchema = new mongoose_1.default.Schema({
    text: {
        type: String,
        required: true
    },
    order: {
        type: Number,
        required: true
    },
    options: [optionSchema]
}, { timestamps: true });
exports.PersonalityQuestion = mongoose_1.default.model("PersonalityQuestion", personalityQuestionSchema);
const guestTestResultSchema = new mongoose_1.default.Schema({
    name: String,
    phone: String,
    gender: String,
    matchIds: [mongoose_1.default.Schema.Types.ObjectId],
    answers: [
        {
            questionId: mongoose_1.default.Schema.Types.ObjectId,
            selectedOption: {
                type: String,
                enum: ["agree", "sometimes", "disagree"]
            }
        }
    ],
    totalScore: Number,
    percentage: Number,
    range: String
}, { timestamps: true });
exports.GuestTestResult = mongoose_1.default.model("GuestTestResult", guestTestResultSchema);
