import { Request, Response } from "express";
import { PersonalityQuestionService } from "./personalityQuestions.service";
import { catchAsync } from "../../../utils/catchAsync";
import { sendResponse } from "../../../utils/sendResponse";
import httpStatus from "http-status-codes";
import AppError from "../../../helpers/AppError";

const getPersonalityQuestions = catchAsync(async (req: Request, res: Response) => {
    const { gender } = req.query;

    if (gender && !['male', 'female'].includes(gender as string)) {
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid gender type provided!");
    }

    const result = await PersonalityQuestionService.getAllQuestionsFromDB(gender as string);

    if (!result || result.length === 0) {
        throw new AppError(httpStatus.NOT_FOUND, "No questions found!");
    }

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Personality questions fetched successfully",
        data: result,
    });
});

export const PersonalityQuestionController = {
    getPersonalityQuestions
};