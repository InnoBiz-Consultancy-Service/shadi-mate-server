import { PersonalityQuestion, GuestTestResult } from "./personalityQuestions.model";

const getQuestions = async () => {

    return PersonalityQuestion
        .find()
        .sort({ order: 1 })
        .select("-__v");
};


const submitTest = async (payload: any) => {
    const { answers, name, phone, gender } = payload;


    const dbQuestions = await PersonalityQuestion.find();

    let totalScore = 0;
    const maxScore = 45;

    answers.forEach((userAnswer: any) => {
        const question = dbQuestions.find(
            (q) => q._id.toString() === userAnswer.questionId.toString()
        );

        if (question) {
            const matchedOption = question.options.find(
                (opt) => opt.label === userAnswer.selectedOption
            );

            if (matchedOption) {
                let scoreToAdd = Number(matchedOption.score);


                if (question.order === 5 || question.order === 14) {
                    if (scoreToAdd === 3) scoreToAdd = 1;
                    else if (scoreToAdd === 1) scoreToAdd = 3;
                }

                totalScore += scoreToAdd;
            }
        }
    });


    const percentage = Math.round((totalScore / maxScore) * 100);

    let title = "";
    let desc = "";

    if (percentage >= 80) {
        title = "Social Heart";
        desc = "You are a warm, empathetic individual who thrives on building deep connections and maintaining social harmony.";
    } else if (percentage >= 50) {
        title = "Balanced Soul";
        desc = "You maintain a healthy equilibrium between your personal boundaries and your social commitments.";
    } else {
        title = "Private Thinker";
        desc = "You are an independent, introspective individual who values personal space and thoughtful observation.";
    }

    const result = await GuestTestResult.create({
        name,
        phone,
        gender,
        answers,
        totalScore,
        percentage,
        range: `${title}: ${desc}`
    });

    return result;
};
const getSingleResultFromDB = async (id: string) => {
    const result = await GuestTestResult.findById(id)
        .select("totalScore percentage range -_id");
    return result;
};

const updateGuestProfileInDB = async (id: string, payload: { name: string; phone: string; gender: string }) => {
    const result = await GuestTestResult.findByIdAndUpdate(
        id,
        { $set: payload },
        { new: true, runValidators: true }
    ).select("totalScore percentage range -_id");

    return result;
};
export const PersonalityService = {
    getQuestions,
    submitTest,
    getSingleResultFromDB,
    updateGuestProfileInDB
};