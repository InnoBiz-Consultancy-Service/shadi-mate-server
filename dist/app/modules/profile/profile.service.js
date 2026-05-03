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
exports.ProfileService = exports.getProfileByUserIdFromDB = void 0;
// profile.service.ts
const AppError_1 = __importDefault(require("../../../helpers/AppError"));
const http_status_codes_1 = require("http-status-codes");
const profile_model_1 = require("./profile.model");
const user_model_1 = require("../user/user.model");
const profileQueryBuilder_1 = require("../../../utils/profileQueryBuilder");
const like_servce_1 = require("../like/like.servce");
const profileCompletaion_1 = require("./profileCompletaion");
const mongoose_1 = require("mongoose");
const dreamPartner_service_1 = require("../dreamPartner/dreamPartner.service");
const heightConverter_1 = require("../../../utils/heightConverter");
const checkProfileCompletion = (profile) => {
    var _a, _b, _c, _d, _e;
    return !!(profile.gender &&
        ((_a = profile.address) === null || _a === void 0 ? void 0 : _a.divisionId) &&
        ((_b = profile.address) === null || _b === void 0 ? void 0 : _b.districtId) &&
        ((_c = profile.address) === null || _c === void 0 ? void 0 : _c.details) &&
        ((_d = profile.religion) === null || _d === void 0 ? void 0 : _d.faith) &&
        ((_e = profile.religion) === null || _e === void 0 ? void 0 : _e.practiceLevel) &&
        profile.personality &&
        profile.profession &&
        profile.habits);
};
// ─── Create Profile ───────────────────────────────────────────────────────────
const createProfile = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User ID is required");
    }
    // Convert height if present
    let processedPayload = Object.assign({}, payload);
    if (payload.height !== undefined && payload.height !== null) {
        processedPayload.height = (0, heightConverter_1.toDisplayHeight)(payload.height);
    }
    const profile = yield profile_model_1.Profile.create(Object.assign(Object.assign({}, processedPayload), { userId }));
    const completed = checkProfileCompletion(profile);
    yield user_model_1.User.findByIdAndUpdate(userId, { isProfileCompleted: completed });
    // ─── Cache invalidate ─────────────────────────────────────────────────────
    yield (0, like_servce_1.invalidateProfileCache)(userId);
    try {
        yield dreamPartner_service_1.DreamPartnerService.notifyMatchingUsers(profile);
    }
    catch (err) {
        console.log("❌ match email error:", err);
    }
    return profile;
});
// ─── Update Profile ───────────────────────────────────────────────────────────
const updateProfile = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const updateData = Object.assign({}, payload);
    // Convert height if present
    if (payload.height !== undefined && payload.height !== null) {
        updateData.height = (0, heightConverter_1.toDisplayHeight)(payload.height);
    }
    // ❗ undefined field remove করো
    Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined) {
            delete updateData[key];
        }
    });
    const profile = yield profile_model_1.Profile.findOneAndUpdate({ userId }, updateData, { new: true, runValidators: true });
    if (!profile) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Profile not found");
    }
    return profile;
});
// ─── Get Profiles (Search + Filter) ──────────────────────────────────────────
// profile.service.ts - Updated getProfiles function with height filter
const getProfiles = (query, currentUserId, currentUserGender) => __awaiter(void 0, void 0, void 0, function* () {
    const { search, university, division, district, thana, minAge, maxAge, educationVariety, faith, practiceLevel, personality, habits, minHeight, maxHeight, page = 1, limit = 10, sort = "-createdAt", } = query;
    // ✅ Opposite gender calculate
    const oppositeGender = currentUserGender === "male" ? "female" : "male";
    const builder = new profileQueryBuilder_1.AggregationBuilder(profile_model_1.Profile);
    const lookups = [
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user",
            },
        },
        {
            $lookup: {
                from: "universities",
                localField: "education.graduation.universityId",
                foreignField: "_id",
                as: "university",
            },
        },
        {
            $lookup: {
                from: "divisions",
                localField: "address.divisionId",
                foreignField: "_id",
                as: "division",
            },
        },
        {
            $lookup: {
                from: "districts",
                localField: "address.districtId",
                foreignField: "_id",
                as: "district",
            },
        },
        {
            $lookup: {
                from: "thanas",
                localField: "address.thanaId",
                foreignField: "_id",
                as: "thana",
            },
        },
    ];
    builder.addLookups(lookups);
    builder.addMatch("userId", { $ne: new mongoose_1.Types.ObjectId(currentUserId) });
    builder.addMatch("user.gender", oppositeGender);
    builder
        .addRegexMatch("university.name", university)
        .addRegexMatch("division.name", division)
        .addRegexMatch("district.name", district)
        .addRegexMatch("thana.name", thana);
    if (educationVariety)
        builder.addMatch("education.graduation.variety", educationVariety);
    if (faith)
        builder.addMatch("religion.faith", faith);
    if (practiceLevel)
        builder.addMatch("religion.practiceLevel", practiceLevel);
    if (personality)
        builder.addMatch("personality", personality);
    if (habits === null || habits === void 0 ? void 0 : habits.length)
        builder.addMatch("habits", { $in: habits });
    // ✅ Fixed Height filter using addProject
    if (minHeight !== undefined || maxHeight !== undefined) {
        // Add project stage to extract cm from height string
        builder.addProject({
            heightCm: {
                $cond: {
                    if: { $ne: ["$height", null] },
                    then: {
                        $toInt: {
                            $arrayElemAt: [
                                { $split: [{ $arrayElemAt: [{ $split: ["$height", " - "] }, 1] }, "cm"] },
                                0
                            ]
                        }
                    },
                    else: null
                }
            },
            // Keep all other fields
            userId: 1,
            birthDate: 1,
            relation: 1,
            fatherOccupation: 1,
            motherOccupation: 1,
            maritalStatus: 1,
            address: 1,
            education: 1,
            religion: 1,
            aboutMe: 1,
            height: 1,
            weight: 1,
            skinTone: 1,
            profession: 1,
            salaryRange: 1,
            economicalStatus: 1,
            personality: 1,
            habits: 1,
            image: 1,
            createdAt: 1,
            updatedAt: 1,
            user: 1,
            university: 1,
            division: 1,
            district: 1,
            thana: 1,
        });
        // Add height filter conditions
        const heightConditions = [];
        if (minHeight !== undefined) {
            heightConditions.push({ heightCm: { $gte: minHeight } });
        }
        if (maxHeight !== undefined) {
            heightConditions.push({ heightCm: { $lte: maxHeight } });
        }
        if (heightConditions.length > 0) {
            builder.addMatch({ $and: heightConditions });
        }
    }
    if (minAge || maxAge) {
        const now = new Date();
        const ageFilter = {};
        if (minAge)
            ageFilter.$lte = new Date(now.getFullYear() - minAge, now.getMonth(), now.getDate());
        if (maxAge)
            ageFilter.$gte = new Date(now.getFullYear() - maxAge, now.getMonth(), now.getDate());
        builder.addMatch("birthDate", ageFilter);
    }
    if (search) {
        builder.addSearch(search, [
            "user.name",
            "education.graduation.institution",
            "division.name",
            "district.name",
            "thana.name",
        ]);
    }
    const results = yield builder
        .addSort(sort)
        .addPagination(Number(page), Number(limit))
        .build()
        .execute();
    // Remove temporary heightCm field from results if needed
    if (results.data) {
        results.data = results.data.map((item) => {
            if (item.heightCm !== undefined) {
                delete item.heightCm;
            }
            return item;
        });
    }
    return results;
});
// ─── Get My Profile ───────────────────────────────────────────────────────────
const getMyProfile = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User ID is required");
    const [profile, user] = yield Promise.all([
        profile_model_1.Profile.findOne({ userId })
            .populate("userId", "name phone email gender")
            .populate("address.divisionId", "name")
            .populate("address.districtId", "name")
            .populate("address.thanaId", "name")
            .lean(),
        user_model_1.User.findById(userId).lean(),
    ]);
    if (!profile)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Profile not found");
    // ─── Completion percentage ────────────────────────────────────────────────
    const completion = (0, profileCompletaion_1.calculateCompletionPercentage)(user, profile);
    return Object.assign(Object.assign({}, profile), { completionPercentage: completion.percentage, completionLabel: (0, profileCompletaion_1.getCompletionLabel)(completion.percentage), missingFields: completion.missingFields.map((f) => ({
            key: f.key,
            label: f.label,
        })) });
});
const getProfileByUserIdFromDB = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.Types.ObjectId.isValid(userId)) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid user ID");
    }
    const profile = yield profile_model_1.Profile.findOne({ userId })
        .populate("userId", "name email")
        .lean();
    if (!profile) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Profile not found");
    }
    return profile;
});
exports.getProfileByUserIdFromDB = getProfileByUserIdFromDB;
exports.ProfileService = {
    createProfile,
    updateProfile,
    getProfiles,
    getMyProfile,
    getProfileByUserIdFromDB: exports.getProfileByUserIdFromDB
};
