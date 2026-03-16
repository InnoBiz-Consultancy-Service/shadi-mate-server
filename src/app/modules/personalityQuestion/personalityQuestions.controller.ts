import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../../utils/catchAsync";
import { sendResponse } from "../../../utils/sendResponse";
import { PersonalityService } from "./personalityQuestions.service";


export const getQuestions = catchAsync(
    async (req: Request, res: Response) => {

        const result = await PersonalityService.getQuestions();

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Questions fetched successfully",
            data: result
        });
    }
);


export const submitTest = catchAsync(
    async (req: Request, res: Response) => {

        const result =
            await PersonalityService.submitTest(req.body);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Personality test submitted successfully",
            data: result
        });
    }
);