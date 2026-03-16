import express from "express";
import { getQuestions, getSingleResult, submitTest, updateGuestProfile } from "./personalityQuestions.controller";

const router = express.Router();

router.get("/questions", getQuestions);

router.post("/submit", submitTest);
router.get("/:id", getSingleResult)
router.patch("/:id", updateGuestProfile)

export const PersonalityQuestionRoutes = router;