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
    const { answers, name, phone, gender } = payload;
    const dbQuestions = yield personalityQuestions_model_1.PersonalityQuestion.find();
    let totalScore = 0;
    const maxScore = 45;
    answers.forEach((userAnswer) => {
        const question = dbQuestions.find((q) => q._id.toString() === userAnswer.questionId.toString());
        if (question) {
            const matchedOption = question.options.find((opt) => opt.label === userAnswer.selectedOption);
            if (matchedOption) {
                let scoreToAdd = Number(matchedOption.score);
                if (question.order === 5 || question.order === 14) {
                    if (scoreToAdd === 3)
                        scoreToAdd = 1;
                    else if (scoreToAdd === 1)
                        scoreToAdd = 3;
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
    }
    else if (percentage >= 50) {
        title = "Balanced Soul";
        desc = "You maintain a healthy equilibrium between your personal boundaries and your social commitments.";
    }
    else {
        title = "Private Thinker";
        desc = "You are an independent, introspective individual who values personal space and thoughtful observation.";
    }
    const result = yield personalityQuestions_model_1.GuestTestResult.create({
        name,
        phone,
        gender,
        answers,
        totalScore,
        percentage,
        range: `${title}: ${desc}`
    });
    return result;
});
const getSingleResultFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield personalityQuestions_model_1.GuestTestResult.findById(id).select("totalScore percentage range phone -_id");
    if (!result) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Result not found");
    }
    if (!result.phone) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Phone number is missing for this result");
    }
    const { totalScore, percentage, range } = result;
    return { totalScore, percentage, range };
});
const updateGuestProfileInDB = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield personalityQuestions_model_1.GuestTestResult.findByIdAndUpdate(id, { $set: payload }, { new: true, runValidators: true }).select("totalScore percentage range -_id");
    return result;
});
exports.PersonalityService = {
    getQuestions,
    submitTest,
    getSingleResultFromDB,
    updateGuestProfileInDB
};
