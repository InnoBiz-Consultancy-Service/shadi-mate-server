import express from "express";
import { PersonalityQuestionController } from "./personalityQuestions.controller";

const router = express.Router();

router.get(
    "/",
    PersonalityQuestionController.getPersonalityQuestions
);

export const PersonalityQuestionRoutes = router;