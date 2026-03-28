import { PersonalityQuestion } from "../app/modules/personalityQuestion/personalityQuestions.model";
import { questions } from "../data/personalityQuestions";

export const seedPersonalityQuestions = async () => {

    const exists = await PersonalityQuestion.countDocuments();

    if (exists) {
        console.log("Questions already seeded");
        return;
    }



    const finalQuestions = questions.map(q => ({
        ...q,
        options: [
            { label: "agree", text: "Agree", score: 3 },
            { label: "sometimes", text: "Sometimes", score: 2 },
            { label: "disagree", text: "Disagree", score: 1 }
        ]
    }));

    await PersonalityQuestion.insertMany(finalQuestions);

    console.log("Personality Questions Seeded");
};