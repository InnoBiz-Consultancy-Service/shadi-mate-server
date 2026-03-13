import { PersonalityQuestion } from "./personalityQuestions.model";

const getAllQuestionsFromDB = async (gender?: string) => {
    const query = gender ? { gender } : {};
    const result = await PersonalityQuestion.find(query).sort({ id: 1 });
    return result;
};

export const PersonalityQuestionService = {
    getAllQuestionsFromDB
};