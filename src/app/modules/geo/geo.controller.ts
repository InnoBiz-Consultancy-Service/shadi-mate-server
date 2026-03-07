import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../../utils/catchAsync";
import { sendResponse } from "../../../utils/sendResponse";
import { University, Division, District, Thana } from "./geo.model";

// ─── Universities ─────────────────────────────────────────────────────────────
// GET /api/geo/universities          → all universities
// GET /api/geo/universities?type=govt  → only govt
// GET /api/geo/universities?type=private → only private
const getUniversities = catchAsync(async (req: Request, res: Response) => {
    const filter: Record<string, string> = {};
    if (req.query.type === "govt" || req.query.type === "private") {
        filter.type = req.query.type;
    }

    const universities = await University.find(filter).select("-__v -createdAt -updatedAt").sort({ name: 1 });

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Universities fetched successfully",
        data: universities,
    });
});

// ─── Divisions ────────────────────────────────────────────────────────────────
// GET /api/geo/divisions
const getDivisions = catchAsync(async (_req: Request, res: Response) => {
    const divisions = await Division.find().select("-__v -createdAt -updatedAt").sort({ name: 1 });

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Divisions fetched successfully",
        data: divisions,
    });
});

// ─── Districts by Division ────────────────────────────────────────────────────
// GET /api/geo/divisions/:divisionId/districts
const getDistrictsByDivision = catchAsync(async (req: Request, res: Response) => {
    const { divisionId } = req.params;
    const districts = await District.find({ divisionId }).select("-__v -createdAt -updatedAt").sort({ name: 1 });

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Districts fetched successfully",
        data: districts,
    });
});

// ─── Thanas by District ───────────────────────────────────────────────────────
// GET /api/geo/districts/:districtId/thanas
const getThanasByDistrict = catchAsync(async (req: Request, res: Response) => {
    const { districtId } = req.params;
    const thanas = await Thana.find({ districtId }).select("-__v -createdAt -updatedAt").sort({ name: 1 });

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Thanas fetched successfully",
        data: thanas,
    });
});

export const GeoController = {
    getUniversities,
    getDivisions,
    getDistrictsByDivision,
    getThanasByDistrict,
};
