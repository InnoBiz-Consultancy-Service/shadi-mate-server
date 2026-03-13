import { model, Schema } from "mongoose";

const personalityQuestionSchema = new Schema({
    id: { type: String, required: true, unique: true },
    gender: { type: String, enum: ['male', 'female'], required: true },
    questionText: {
        bn: { type: String, required: true },
        en: { type: String, required: true }
    },
    options: [{
        label: { type: String, required: true },
        bn: { type: String, required: true },
        en: { type: String, required: true }
    }],
    note: { type: String }
});
export const PersonalityQuestion = model('PersonalityQuestion', personalityQuestionSchema);