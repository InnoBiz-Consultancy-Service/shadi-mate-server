import { StatusCodes } from "http-status-codes";
import AppError from "../../../helpers/AppError";
import { PersonalityQuestion, GuestTestResult } from "./personalityQuestions.model";

const getQuestions = async () => {

    return PersonalityQuestion
        .find()
        .sort({ order: 1 })
        .select("-__v");
};

const submitTest = async (payload: any) => {
    const { answers } = payload;

    if (!answers || answers.length === 0) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Answers are required");
    }

    let caring = 0;
    let ambitious = 0;
    let balanced = 0;

    // Question category mapping
    const caringQ = [1, 2, 3, 4, 9, 12, 15];
    const ambitiousQ = [5, 6, 8, 11];
    const balancedQ = [7, 10, 13, 14];

    const dbQuestions = await PersonalityQuestion.find();

    answers.forEach((userAnswer: any) => {
        if (userAnswer.selectedOption !== "agree") return;

        const question = dbQuestions.find(
            (q) => q._id.toString() === userAnswer.questionId.toString()
        );

        if (!question) return;

        const order = question.order;

        if (caringQ.includes(order)) caring++;
        else if (ambitiousQ.includes(order)) ambitious++;
        else if (balancedQ.includes(order)) balanced++;
    });

    // determine personality type
    let type = "";
    let message = "";

    if (caring >= ambitious && caring >= balanced) {
        type = "Caring Soul";
        message =
            "আপনি সম্পর্কের গভীরতা এবং সঙ্গীর যত্নে বিশ্বাসী। আপনার কাছে বিশ্বাস আর ভালোবাসাই একটি সুন্দর জীবনের মূল ভিত্তি।";
    } else if (balanced >= ambitious && balanced >= caring) {
        type = "Balanced Thinker";
        message =
            "আপনি হুটহাট আবেগ দিয়ে চলেন না। আপনি যেমন সঙ্গীকে ভালোবাসেন, তেমনি নিজের স্বাধীনতা এবং ব্যক্তিগত পছন্দগুলোকেও গুরুত্বের সাথে দেখেন।";
    } else {
        type = "Ambitious Mind";
        message =
            "আপনি নিজের ক্যারিয়ার এবং ব্যক্তিগত লক্ষ্য নিয়ে সচেতন। আপনি এমন একজন সঙ্গী চান যে শুধু আপনার জীবনসঙ্গী নয়, বরং আপনার স্বপ্নের পথে একজন দারুণ সহযোগী হবে।";
    }

    // Save only answers and result
    const result = await GuestTestResult.create({
        answers,
        type,
        message
    });

    return result;
};
const getSingleResultFromDB = async (id: string) => {
    const result = await GuestTestResult.findById(id).select(
        "totalScore percentage type email -_id"
    );

    if (!result) {
        throw new AppError(
            StatusCodes.NOT_FOUND,
            "Result not found"
        );
    }

    if (!result.email) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            "Email is missing for this result"
        );
    }

    const {  type,email } = result;

    return { type,email };
};

const updateGuestProfileInDB = async (id: string, payload: { name: string; email: string; gender: string }) => {
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