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
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedPersonalityQuestions = void 0;
const personalityQuestions_model_1 = require("../app/modules/personalityQuestion/personalityQuestions.model");
const personalityQuestions_1 = require("../data/personalityQuestions");
const seedPersonalityQuestions = () => __awaiter(void 0, void 0, void 0, function* () {
    const exists = yield personalityQuestions_model_1.PersonalityQuestion.countDocuments();
    if (exists) {
        console.log("Questions already seeded");
        return;
    }
    const finalQuestions = personalityQuestions_1.questions.map(q => (Object.assign(Object.assign({}, q), { options: [
            { label: "agree", text: "Agree", score: 3 },
            { label: "sometimes", text: "Sometimes", score: 2 },
            { label: "disagree", text: "Disagree", score: 1 }
        ] })));
    yield personalityQuestions_model_1.PersonalityQuestion.insertMany(finalQuestions);
    console.log("Personality Questions Seeded");
});
exports.seedPersonalityQuestions = seedPersonalityQuestions;
