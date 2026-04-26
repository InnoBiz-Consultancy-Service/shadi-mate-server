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
const dreamPartner_model_1 = require("./dreamPartner.model");
const profile_model_1 = require("../profile/profile.model");
const AppError_1 = __importDefault(require("../../../helpers/AppError"));
const mailer_1 = require("../../../utils/mailer");
const user_model_1 = require("../user/user.model");
const savePreference = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User ID is required");
    const existing = yield dreamPartner_model_1.DreamPartnerPreference.findOne({ userId });
    if (existing) {
        return yield dreamPartner_model_1.DreamPartnerPreference.findOneAndUpdate({ userId }, payload, { new: true, runValidators: true });
    }
    return yield dreamPartner_model_1.DreamPartnerPreference.create(Object.assign({ userId }, payload));
});
const mongoose_1 = __importDefault(require("mongoose"));
const findMatches = (userId_1, ...args_1) => __awaiter(void 0, [userId_1, ...args_1], void 0, function* (userId, page = 1, limit = 10) {
    const preference = yield dreamPartner_model_1.DreamPartnerPreference.findOne({ userId });
    if (!preference)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Dream Partner preference not found");
    const { practiceLevel, economicalStatus, habits } = preference;
    const matches = yield profile_model_1.Profile.aggregate([
        {
            $match: {
                userId: { $ne: new mongoose_1.default.Types.ObjectId(userId) }
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
        { $sort: { matchScore: -1 } },
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
const notifyMatchingUsers = (profile) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const preferences = yield dreamPartner_model_1.DreamPartnerPreference.find();
    for (const pref of preferences) {
        let score = 0;
        const total = 3;
        if (pref.practiceLevel === ((_a = profile.religion) === null || _a === void 0 ? void 0 : _a.practiceLevel))
            score++;
        if (pref.economicalStatus === profile.economicalStatus)
            score++;
        if (((_b = pref.habits) === null || _b === void 0 ? void 0 : _b.length) &&
            ((_c = profile.habits) === null || _c === void 0 ? void 0 : _c.some((h) => pref.habits.includes(h)))) {
            score++;
        }
        const matchPercentage = (score / total) * 100;
        if (matchPercentage >= 40) {
            // 🔥 IMPORTANT: THIS USER IS RECEIVER (preference owner)
            const user = yield user_model_1.User.findById(pref.userId).select("email name");
            if (user === null || user === void 0 ? void 0 : user.email) {
                yield (0, mailer_1.sendMatchEmail)({
                    to: user.email,
                    name: user.name,
                    profileId: profile.userId.toString(),
                    matchPercentage,
                });
            }
        }
    }
});
exports.DreamPartnerService = {
    savePreference,
    findMatches,
    notifyMatchingUsers,
};
