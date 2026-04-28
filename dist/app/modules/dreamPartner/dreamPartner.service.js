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
const mongoose_1 = __importDefault(require("mongoose"));
const savePreference = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User ID is required");
    const existing = yield dreamPartner_model_1.DreamPartnerPreference.findOne({ userId });
    if (existing) {
        return yield dreamPartner_model_1.DreamPartnerPreference.findOneAndUpdate({ userId }, payload, { new: true, runValidators: true });
    }
    return yield dreamPartner_model_1.DreamPartnerPreference.create(Object.assign({ userId }, payload));
});
// dreamPartner.service.ts
const findMatches = (userId_1, userGender_1, ...args_1) => __awaiter(void 0, [userId_1, userGender_1, ...args_1], void 0, function* (userId, userGender, page = 1, limit = 10) {
    const preference = yield dreamPartner_model_1.DreamPartnerPreference.findOne({ userId });
    // ✅ FIX: no error
    if (!preference) {
        return {
            data: [],
            meta: {
                page,
                limit,
                total: 0,
            },
            message: "Please set your dream partner preference first",
        };
    }
    const { practiceLevel, economicalStatus, habits } = preference;
    const oppositeGender = userGender === "male" ? "female" : "male";
    const matches = yield profile_model_1.Profile.aggregate([
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user",
            },
        },
        { $unwind: "$user" },
        {
            $match: {
                userId: { $ne: new mongoose_1.default.Types.ObjectId(userId) },
                "user.gender": oppositeGender,
            },
        },
        {
            $addFields: {
                matchScore: {
                    $add: [
                        { $cond: [{ $eq: ["$religion.practiceLevel", practiceLevel] }, 1, 0] },
                        { $cond: [{ $eq: ["$economicalStatus", economicalStatus] }, 1, 0] },
                        {
                            $cond: [
                                { $gt: [{ $size: { $setIntersection: ["$habits", habits] } }, 0] },
                                1,
                                0,
                            ],
                        },
                    ],
                },
            },
        },
        { $sort: { matchScore: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
    ]);
    return {
        data: matches,
        meta: {
            page,
            limit,
            total: matches.length,
        },
    };
});
const notifyMatchingUsers = (profile) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const newProfileUser = yield user_model_1.User.findById(profile.userId).select("gender").lean();
    if (!(newProfileUser === null || newProfileUser === void 0 ? void 0 : newProfileUser.gender))
        return;
    const newProfileGender = newProfileUser.gender;
    const receiverGender = newProfileGender === "male" ? "female" : "male";
    const preferences = yield dreamPartner_model_1.DreamPartnerPreference.aggregate([
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user",
            },
        },
        {
            $unwind: "$user",
        },
        {
            $match: {
                "user.gender": receiverGender,
                userId: {
                    $ne: new mongoose_1.default.Types.ObjectId(profile.userId.toString()),
                },
            },
        },
    ]);
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
            const user = (_d = pref.user) === null || _d === void 0 ? void 0 : _d[0];
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
