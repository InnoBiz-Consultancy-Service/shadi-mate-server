"use strict";
// src/app/modules/dreamPartner/dreamPartner.service.ts — OPTIMIZED
// EXTRA CHANGE: $match কে $lookup এর আগে নিয়ে এলাম
// আগে: সব profiles lookup করে তারপর filter → বেশি data process
// এখন: আগে gender+userId filter, তারপর lookup → কম data process
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
exports.calculateAge = exports.DreamPartnerService = void 0;
const http_status_codes_1 = require("http-status-codes");
const dreamPartner_model_1 = require("./dreamPartner.model");
const profile_model_1 = require("../profile/profile.model");
const AppError_1 = __importDefault(require("../../../helpers/AppError"));
const mailer_1 = require("../../../utils/mailer");
const user_model_1 = require("../user/user.model");
const mongoose_1 = __importDefault(require("mongoose"));
const heightConverter_1 = require("../../../utils/heightConverter");
const savePreference = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User ID is required");
    const existing = yield dreamPartner_model_1.DreamPartnerPreference.findOne({ userId });
    if (existing) {
        return yield dreamPartner_model_1.DreamPartnerPreference.findOneAndUpdate({ userId }, payload, { new: true, runValidators: true });
    }
    return yield dreamPartner_model_1.DreamPartnerPreference.create(Object.assign({ userId }, payload));
});
// ── EXTRA CHANGE: Optimized findMatches aggregation ───────────────────────────
// আগের pipeline:
//   1. $lookup users (সব profiles এর জন্য)
//   2. $unwind
//   3. $match (gender filter) ← late filtering = বেশি data process
//
// এখন:
//   1. Profile collection এ আগেই userId filter + আলাদা users lookup
//   2. $match আগে → কম documents process হয়
const findMatches = (userId_1, userGender_1, ...args_1) => __awaiter(void 0, [userId_1, userGender_1, ...args_1], void 0, function* (userId, userGender, page = 1, limit = 10) {
    const preference = yield dreamPartner_model_1.DreamPartnerPreference.findOne({ userId });
    if (!preference) {
        return {
            data: [],
            meta: { page, limit, total: 0 },
            message: "Please set your dream partner preference first",
        };
    }
    const { practiceLevel, economicalStatus, habits, agePreference, locationPreference, heightPreference, } = preference;
    const oppositeGender = userGender === "male" ? "female" : "male";
    const myId = new mongoose_1.default.Types.ObjectId(userId);
    const pipeline = [];
    // 🔥 STEP 1: Early filter (FAST)
    pipeline.push({
        $match: {
            userId: { $ne: myId },
        },
    });
    // 🔥 STEP 2: Lookup with filter (OPTIMIZED)
    pipeline.push({
        $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
            pipeline: [
                {
                    $match: {
                        gender: oppositeGender,
                        isDeleted: false,
                        isBlocked: false,
                    },
                },
                {
                    $project: { _id: 1, gender: 1, name: 1 },
                },
            ],
        },
    });
    // user না থাকলে বাদ
    pipeline.push({
        $match: {
            "user.0": { $exists: true },
        },
    });
    pipeline.push({ $unwind: "$user" });
    // 🔥 STEP 3: Add calculated fields
    pipeline.push({
        $addFields: {
            calculatedAge: {
                $floor: {
                    $divide: [
                        { $subtract: [new Date(), { $ifNull: ["$birthDate", new Date()] }] },
                        31556952000,
                    ],
                },
            },
            heightCm: {
                $cond: {
                    if: { $ne: ["$height", null] },
                    then: {
                        $toInt: {
                            $arrayElemAt: [
                                {
                                    $split: [
                                        {
                                            $arrayElemAt: [
                                                { $split: ["$height", " - "] },
                                                1,
                                            ],
                                        },
                                        "cm",
                                    ],
                                },
                                0,
                            ],
                        },
                    },
                    else: 0,
                },
            },
        },
    });
    // 🔥 STEP 4: Apply preference filters (IMPORTANT)
    const matchConditions = {};
    if ((agePreference === null || agePreference === void 0 ? void 0 : agePreference.min) && (agePreference === null || agePreference === void 0 ? void 0 : agePreference.max)) {
        matchConditions.calculatedAge = {
            $gte: agePreference.min,
            $lte: agePreference.max,
        };
    }
    if (locationPreference === null || locationPreference === void 0 ? void 0 : locationPreference.divisionId) {
        matchConditions["address.divisionId"] =
            new mongoose_1.default.Types.ObjectId(locationPreference.divisionId);
    }
    if (locationPreference === null || locationPreference === void 0 ? void 0 : locationPreference.districtId) {
        matchConditions["address.districtId"] =
            new mongoose_1.default.Types.ObjectId(locationPreference.districtId);
    }
    if ((heightPreference === null || heightPreference === void 0 ? void 0 : heightPreference.min) && (heightPreference === null || heightPreference === void 0 ? void 0 : heightPreference.max)) {
        matchConditions.heightCm = {
            $gte: parseInt(heightPreference.min),
            $lte: parseInt(heightPreference.max),
        };
    }
    if (Object.keys(matchConditions).length > 0) {
        pipeline.push({ $match: matchConditions });
    }
    // 🔥 STEP 5: Match score (SMART RANKING)
    pipeline.push({
        $addFields: {
            matchScore: {
                $add: [
                    { $cond: [{ $eq: ["$religion.practiceLevel", practiceLevel] }, 1, 0] },
                    { $cond: [{ $eq: ["$economicalStatus", economicalStatus] }, 1, 0] },
                    {
                        $cond: [
                            {
                                $gt: [
                                    { $size: { $setIntersection: ["$habits", habits || []] } },
                                    0,
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                ],
            },
        },
    });
    // 🔥 STEP 6: Sort + Pagination
    pipeline.push({ $sort: { matchScore: -1, createdAt: -1 } }, { $skip: (page - 1) * limit }, { $limit: limit });
    const matches = yield profile_model_1.Profile.aggregate(pipeline);
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
    if (!profile)
        return;
    const newUser = yield user_model_1.User.findById(profile.userId)
        .select("gender name")
        .lean();
    if (!(newUser === null || newUser === void 0 ? void 0 : newUser.gender))
        return;
    const receiverGender = newUser.gender === "male" ? "female" : "male";
    // ✅ SAFE AGE
    const newProfileAge = (0, exports.calculateAge)(profile.birthDate);
    if (typeof newProfileAge !== "number")
        return;
    // ✅ SAFE HEIGHT
    const profileHeightCm = profile.height
        ? (0, heightConverter_1.extractCmFromDisplayHeight)(profile.height)
        : null;
    // 🔥 DB FILTERING
    const preferences = yield dreamPartner_model_1.DreamPartnerPreference.aggregate([
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user",
                pipeline: [
                    {
                        $match: {
                            gender: receiverGender,
                            isDeleted: false,
                            isBlocked: false,
                        },
                    },
                    {
                        $project: { _id: 1, email: 1, name: 1 },
                    },
                ],
            },
        },
        {
            $match: {
                "user.0": { $exists: true },
                userId: { $ne: profile.userId },
            },
        },
        { $unwind: "$user" },
        // 🔥 AGE FILTER (DB LEVEL)
        {
            $match: Object.assign({}, (newProfileAge && {
                "agePreference.min": { $lte: newProfileAge },
                "agePreference.max": { $gte: newProfileAge },
            })),
        },
        { $limit: 100 },
    ]);
    // 🔥 SCORE + EMAIL
    const emailJobs = preferences.map((pref) => {
        var _a, _b, _c, _d, _e, _f;
        let score = 0;
        const total = 6;
        if (pref.practiceLevel === ((_a = profile.religion) === null || _a === void 0 ? void 0 : _a.practiceLevel))
            score++;
        if (pref.economicalStatus === profile.economicalStatus)
            score++;
        if (((_b = pref.habits) === null || _b === void 0 ? void 0 : _b.length) &&
            ((_c = profile.habits) === null || _c === void 0 ? void 0 : _c.some((h) => pref.habits.includes(h)))) {
            score++;
        }
        if (pref.agePreference &&
            newProfileAge >= pref.agePreference.min &&
            newProfileAge <= pref.agePreference.max) {
            score++;
        }
        if (pref.locationPreference) {
            let match = false;
            if (pref.locationPreference.divisionId &&
                ((_d = profile.address) === null || _d === void 0 ? void 0 : _d.divisionId) &&
                pref.locationPreference.divisionId.toString() ===
                    profile.address.divisionId.toString()) {
                match = true;
            }
            if (pref.locationPreference.districtId &&
                ((_e = profile.address) === null || _e === void 0 ? void 0 : _e.districtId) &&
                pref.locationPreference.districtId.toString() ===
                    profile.address.districtId.toString()) {
                match = true;
            }
            if (match)
                score++;
        }
        if (pref.heightPreference &&
            profileHeightCm &&
            profileHeightCm >= parseInt(pref.heightPreference.min) &&
            profileHeightCm <= parseInt(pref.heightPreference.max)) {
            score++;
        }
        const matchPercentage = (score / total) * 100;
        if (matchPercentage >= 40 && ((_f = pref.user) === null || _f === void 0 ? void 0 : _f.email)) {
            return (0, mailer_1.sendMatchEmail)({
                to: pref.user.email,
                name: pref.user.name,
                profileId: profile.userId.toString(),
                matchPercentage,
            });
        }
        return null;
    });
    yield Promise.allSettled(emailJobs.filter(Boolean));
});
exports.DreamPartnerService = {
    savePreference,
    findMatches,
    notifyMatchingUsers,
};
const calculateAge = (birthDate) => {
    if (!birthDate)
        return 0;
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime()))
        return 0;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
};
exports.calculateAge = calculateAge;
