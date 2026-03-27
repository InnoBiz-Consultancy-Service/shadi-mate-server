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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DreamPartnerService = void 0;
// services/dreamPartner.service.ts
const http_status_codes_1 = require("http-status-codes");
const dreamPartner_model_1 = require("../dreamPartner/dreamPartner.model");
const profile_model_1 = require("../modules/profile/profile.model");
const AppError_1 = __importDefault(require("../../helpers/AppError"));
const savePreference = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User ID is required");
    const existing = yield dreamPartner_model_1.DreamPartnerPreference.findOne({ userId });
    if (existing) {
        return yield dreamPartner_model_1.DreamPartnerPreference.findOneAndUpdate({ userId }, payload, { new: true, runValidators: true });
    }
    return yield dreamPartner_model_1.DreamPartnerPreference.create(Object.assign({ userId }, payload));
});
const findMatches = (userId_1, ...args_1) => __awaiter(void 0, [userId_1, ...args_1], void 0, function* (userId, page = 1, limit = 10) {
    const preference = yield dreamPartner_model_1.DreamPartnerPreference.findOne({ userId });
    if (!preference)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Dream Partner preference not found");
    const { practiceLevel, economicalStatus, habits } = preference;
    const matches = yield profile_model_1.Profile.aggregate([
        {
            $match: {
                _id: { $ne: userId } // নিজের profile বাদ দিবে
            }
        },
        {
            $addFields: {
                matchScore: {
                    $add: [
                        { $cond: [{ $eq: ["$religion.practiceLevel", practiceLevel] }, 1, 0] },
                        { $cond: [{ $eq: ["$economicalStatus", economicalStatus] }, 1, 0] },
                        { $cond: [{ $gt: [{ $size: { $setIntersection: ["$habits", habits] } }, 0] }, 1, 0] }
                    ]
                }
            }
        },
        { $sort: { matchScore: -1, "userId.name": 1 } }, // score অনুযায়ী descending
        { $skip: (page - 1) * limit },
        { $limit: limit },
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user"
            }
        },
        {
            $lookup: {
                from: "universities",
                localField: "education.graduation.universityId",
                foreignField: "_id",
                as: "university"
            }
        },
        {
            $lookup: {
                from: "divisions",
                localField: "address.divisionId",
                foreignField: "_id",
                as: "division"
            }
        },
        {
            $lookup: {
                from: "districts",
                localField: "address.districtId",
                foreignField: "_id",
                as: "district"
            }
        },
        {
            $lookup: {
                from: "thanas",
                localField: "address.thanaId",
                foreignField: "_id",
                as: "thana"
            }
        }
    ]);
    return matches;
});
exports.DreamPartnerService = {
    savePreference,
    findMatches,
};
