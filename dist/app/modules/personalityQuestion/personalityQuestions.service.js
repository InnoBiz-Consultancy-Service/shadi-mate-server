"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonalityService = void 0;
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../../helpers/AppError"));
const personalityQuestions_model_1 = require("./personalityQuestions.model");
const getQuestions = () => __awaiter(void 0, void 0, void 0, function* () {
    return personalityQuestions_model_1.PersonalityQuestion
        .find()
        .sort({ order: 1 })
        .select("-__v");
});
const submitTest = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { answers } = payload;
    if (!answers || answers.length === 0) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Answers are required");
    }
    let caring = 0;
    let ambitious = 0;
    let balanced = 0;
    // Question category mapping
    const caringQ = [1, 2, 3, 4, 9, 12, 15];
    const ambitiousQ = [5, 6, 8, 11];
    const balancedQ = [7, 10, 13, 14];
    const dbQuestions = yield personalityQuestions_model_1.PersonalityQuestion.find();
    answers.forEach((userAnswer) => {
        if (userAnswer.selectedOption !== "agree")
            return;
        const question = dbQuestions.find((q) => q._id.toString() === userAnswer.questionId.toString());
        if (!question)
            return;
        const order = question.order;
        if (caringQ.includes(order))
            caring++;
        else if (ambitiousQ.includes(order))
            ambitious++;
        else if (balancedQ.includes(order))
            balanced++;
    });
    // determine personality type
    let type = "";
    let message = "";
    if (caring >= ambitious && caring >= balanced) {
        type = "Caring Soul";
        message =
            "আপনি সম্পর্কের গভীরতা এবং সঙ্গীর যত্নে বিশ্বাসী। আপনার কাছে বিশ্বাস আর ভালোবাসাই একটি সুন্দর জীবনের মূল ভিত্তি।";
    }
    else if (balanced >= ambitious && balanced >= caring) {
        type = "Balanced Thinker";
        message =
            "আপনি হুটহাট আবেগ দিয়ে চলেন না। আপনি যেমন সঙ্গীকে ভালোবাসেন, তেমনি নিজের স্বাধীনতা এবং ব্যক্তিগত পছন্দগুলোকেও গুরুত্বের সাথে দেখেন।";
    }
    else {
        type = "Ambitious Mind";
        message =
            "আপনি নিজের ক্যারিয়ার এবং ব্যক্তিগত লক্ষ্য নিয়ে সচেতন। আপনি এমন একজন সঙ্গী চান যে শুধু আপনার জীবনসঙ্গী নয়, বরং আপনার স্বপ্নের পথে একজন দারুণ সহযোগী হবে।";
    }
    // Save only answers and result
    const result = yield personalityQuestions_model_1.GuestTestResult.create({
        answers,
        type,
        message
    });
    return result;
});
const getSingleResultFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield personalityQuestions_model_1.GuestTestResult.findById(id)
        .select("type message email name gender -_id");
    console.log(result === null || result === void 0 ? void 0 : result.email);
    if (!result) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Result not found");
    }
    // 🔴 Email must exist
    if (!result.email) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Email is required to view this result");
    }
    const { type, message, email, name, gender } = result;
    return {
        type,
        message: message || null,
        email,
        name: name || null,
        gender: gender || null
    };
});
const updateGuestProfileInDB = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield personalityQuestions_model_1.GuestTestResult.findByIdAndUpdate(id, { $set: payload }, { new: true, runValidators: true }).select("type email message -_id");
    return result;
});
exports.PersonalityService = {
    getQuestions,
    submitTest,
    getSingleResultFromDB,
    updateGuestProfileInDB
};
