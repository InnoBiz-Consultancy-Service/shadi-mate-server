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
exports.GeoController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = require("../../../utils/catchAsync");
const sendResponse_1 = require("../../../utils/sendResponse");
const geo_model_1 = require("./geo.model");
// ─── Universities ─────────────────────────────────────────────────────────────
const getUniversities = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const filter = {};
    // type filter
    if (req.query.type === "govt" || req.query.type === "private") {
        filter.type = req.query.type;
    }
    if (req.query.search) {
        filter.name = {
            $regex: req.query.search,
            $options: "i",
        };
    }
    const universities = yield geo_model_1.University.find(filter)
        .select("-__v -createdAt -updatedAt")
        .sort({ name: 1 });
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Universities fetched successfully",
        data: universities,
    });
}));
// ─── Divisions ────────────────────────────────────────────────────────────────
// GET /api/geo/divisions
const getDivisions = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const filter = {};
    if (req.query.search) {
        filter.name = {
            $regex: req.query.search,
            $options: "i",
        };
    }
    const divisions = yield geo_model_1.Division.find(filter)
        .select("-__v -createdAt -updatedAt")
        .sort({ name: 1 });
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Divisions fetched successfully",
        data: divisions,
    });
}));
// ─── Districts by Division ────────────────────────────────────────────────────
// GET /api/geo/divisions/:divisionId/districts
const getDistrictsByDivision = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { divisionId } = req.params;
    const filter = { divisionId };
    if (req.query.search) {
        filter.name = {
            $regex: req.query.search,
            $options: "i",
        };
    }
    const districts = yield geo_model_1.District.find(filter)
        .select("-__v -createdAt -updatedAt")
        .sort({ name: 1 });
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Districts fetched successfully",
        data: districts,
    });
}));
// ─── Thanas by District ───────────────────────────────────────────────────────
// GET /api/geo/districts/:districtId/thanas
const getThanasByDistrict = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { districtId } = req.params;
    const filter = { districtId };
    if (req.query.search) {
        filter.name = {
            $regex: req.query.search,
            $options: "i",
        };
    }
    const thanas = yield geo_model_1.Thana.find(filter)
        .select("-__v -createdAt -updatedAt")
        .sort({ name: 1 });
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Thanas fetched successfully",
        data: thanas,
    });
}));
exports.GeoController = {
    getUniversities,
    getDivisions,
    getDistrictsByDivision,
    getThanasByDistrict,
};
