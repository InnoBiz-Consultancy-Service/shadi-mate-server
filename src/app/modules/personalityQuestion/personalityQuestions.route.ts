import express from "express";
import { getQuestions, submitTest } from "./personalityQuestions.controller";

const router = express.Router();

router.get("/questions", getQuestions);

router.post("/submit", submitTest);

export const PersonalityQuestionRoutes = router;