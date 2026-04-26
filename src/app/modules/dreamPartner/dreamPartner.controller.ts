// controllers/dreamPartner.controller.ts
import { Request, Response } from "express";
import { DreamPartnerService } from "./dreamPartner.service";
import { catchAsync } from "../../../utils/catchAsync";
import { sendResponse } from "../../../utils/sendResponse";


export const saveDreamPartnerPreference = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const preference = await DreamPartnerService.savePreference(userId, req.body);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Dream Partner preference saved successfully",
        data: preference,
    });
});

export const getDreamPartnerMatches = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

  const result = await DreamPartnerService.findMatches(
    userId,
    req.user!.gender,
    page,
    limit,
  );

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Matching profiles fetched successfully",
        data: result,
    });
});