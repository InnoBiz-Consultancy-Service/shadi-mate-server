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
const profile_model_1 = require("../profile/profile.model");
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
    // ✅ category mapping
    const caringQ = [1, 2, 3, 4, 9, 12, 15];
    const ambitiousQ = [5, 6, 8, 11];
    const balancedQ = [7, 10, 13, 14];
    // ✅ reverse questions
    const reverseQ = [5, 14];
    // ✅ DB থেকে প্রশ্ন নিয়ে map বানানো (fast)
    const dbQuestions = yield personalityQuestions_model_1.PersonalityQuestion.find();
    const questionMap = new Map(dbQuestions.map((q) => [q._id.toString(), q]));
    // ✅ calculation
    for (const userAnswer of answers) {
        const question = questionMap.get(userAnswer.questionId.toString());
        if (!question)
            continue;
        const selectedOption = question.options.find((opt) => opt.label === userAnswer.selectedOption);
        if (!selectedOption)
            continue;
        let score = selectedOption.score;
        // reverse logic
        if (reverseQ.includes(question.order)) {
            score = 2 - score;
        }
        if (caringQ.includes(question.order))
            caring += score;
        else if (ambitiousQ.includes(question.order))
            ambitious += score;
        else if (balancedQ.includes(question.order))
            balanced += score;
    }
    // ✅ result determine
    const max = Math.max(caring, ambitious, balanced);
    let type = "";
    let message = "";
    if (max === caring) {
        type = "Caring Soul";
        message =
            "You lead with your heart. You value deep emotional connection, trust, and genuine care in a relationship.";
    }
    else if (max === balanced) {
        type = "Balanced Thinker";
        message =
            "You maintain a healthy balance between emotion and logic. You value both love and personal space equally.";
    }
    else {
        type = "Ambitious Mind";
        message =
            "You are goal-oriented and driven. You seek a partner who can grow and build a successful future with you.";
    }
    // ✅ save result
    const result = yield personalityQuestions_model_1.GuestTestResult.create({
        answers,
        type,
        message
    });
    // ✅ suggestions (top 5 profiles)
    const suggestions = yield profile_model_1.Profile.find({ personality: type })
        .populate("userId", "name gender")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
    // ✅ total count
    const total = yield profile_model_1.Profile.countDocuments({
        personality: type
    });
    return {
        result: {
            type,
            message
        },
        suggestions,
        total
    };
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
