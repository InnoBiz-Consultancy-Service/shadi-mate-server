import { maleQuestions, femaleQuestions } from "../data/personalityQuestions";
import { PersonalityQuestion } from "../app/modules/personalityQuestion/personalityQuestions.model";

export const seedPersonalityQuestions = async () => {
    try {
        const allQuestions = [...maleQuestions, ...femaleQuestions];
        const isExist = await PersonalityQuestion.findOne();
        if (!isExist) {
            await PersonalityQuestion.insertMany(allQuestions);
            console.log("Both Male & Female Personality Questions Seeded Successfully!");
        }
    } catch (error) {
        console.log("Error seeding personality questions", error);
    }
};