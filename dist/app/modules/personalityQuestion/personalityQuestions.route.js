"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonalityQuestionRoutes = void 0;
const express_1 = __importDefault(require("express"));
const personalityQuestions_controller_1 = require("./personalityQuestions.controller");
const router = express_1.default.Router();
router.get("/questions", personalityQuestions_controller_1.getQuestions);
router.post("/submit", personalityQuestions_controller_1.submitTest);
router.get("/:id", personalityQuestions_controller_1.getSingleResult);
router.patch("/:id", personalityQuestions_controller_1.updateGuestProfile);
exports.PersonalityQuestionRoutes = router;
