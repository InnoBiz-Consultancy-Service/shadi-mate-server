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
exports.ProfileVisitController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = require("../../../utils/catchAsync");
const sendResponse_1 = require("../../../utils/sendResponse");
const profileVisit_service_1 = require("./profileVisit.service");
// ─── Get Who Visited My Profile (Premium Only) ───────────────────────────────
const getProfileVisitors = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const profileOwnerId = req.user.id;
    const subscription = req.user.subscription;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = yield profileVisit_service_1.ProfileVisitService.getProfileVisitors(profileOwnerId, subscription, page, limit);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Profile visitors fetched successfully",
        data: result.visitors,
        meta: result.meta,
    });
}));
// ─── Get Visit Count (Free & Premium) ────────────────────────────────────────
const getVisitCount = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const profileOwnerId = req.user.id;
    const result = yield profileVisit_service_1.ProfileVisitService.getVisitCount(profileOwnerId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Visit count fetched successfully",
        data: result,
    });
}));
exports.ProfileVisitController = {
    getProfileVisitors,
    getVisitCount,
};
