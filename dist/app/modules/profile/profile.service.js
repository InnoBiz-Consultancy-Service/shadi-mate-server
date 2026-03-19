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
exports.ProfileService = void 0;
const AppError_1 = __importDefault(require("../../../helpers/AppError"));
const http_status_codes_1 = require("http-status-codes");
const profile_model_1 = require("./profile.model");
const user_model_1 = require("../user/user.model");
const profileQueryBuilder_1 = require("../../../utils/profileQueryBuilder");
const personalityQuestions_model_1 = require("../personalityQuestion/personalityQuestions.model");
const checkProfileCompletion = (payload) => {
    var _a, _b, _c, _d;
    if (payload.gender &&
        payload.guardianContact &&
        payload.relation &&
        ((_a = payload.address) === null || _a === void 0 ? void 0 : _a.divisionId) &&
        ((_b = payload.address) === null || _b === void 0 ? void 0 : _b.districtId) &&
        ((_c = payload.address) === null || _c === void 0 ? void 0 : _c.thanaId) &&
        ((_d = payload.address) === null || _d === void 0 ? void 0 : _d.details) &&
        (payload.universityId || payload.collegeName)) {
        return true;
    }
    return false;
};
// ─── Create Profile ─────────────────────────
const createProfile = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User ID is required");
    }
    let phoneToUse = payload.personalityTestPhone;
    let testMessage = null; // ✅ আগে declare
    if (!phoneToUse) {
        const user = yield user_model_1.User.findById(userId).select("phone");
        if (!user || !user.phone) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "No phone number provided and user phone not found");
        }
        phoneToUse = user.phone;
    }
    const testResult = yield personalityQuestions_model_1.GuestTestResult
        .findOne({ phone: phoneToUse })
        .sort({ createdAt: -1 });
    const profile = yield profile_model_1.Profile.create(Object.assign(Object.assign({}, payload), { userId, personalityTestPhone: phoneToUse, personalityTestResult: (testResult === null || testResult === void 0 ? void 0 : testResult._id) || undefined }));
    if (!testResult) {
        testMessage = `No personality test found for phone: ${phoneToUse}`;
    }
    const completed = checkProfileCompletion(payload);
    yield user_model_1.User.findByIdAndUpdate(userId, {
        isProfileCompleted: completed
    });
    return {
        profile,
        testMessage
    };
});
// ─── Update Profile ─────────────────────────
const updateProfile = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const profile = yield profile_model_1.Profile.findOneAndUpdate({ userId }, payload, { new: true, runValidators: true });
    if (!profile) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Profile not found");
    }
    const completed = checkProfileCompletion(profile);
    yield user_model_1.User.findByIdAndUpdate(userId, {
        isProfileCompleted: completed
    });
    return profile;
});
const getProfiles = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { search, university, division, district, thana, gender, address, page = 1, limit = 10, sort = "-createdAt", } = query;
    const builder = new profileQueryBuilder_1.AggregationBuilder(profile_model_1.Profile);
    // Define lookup stages
    const lookups = [
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
                localField: "universityId",
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
    ];
    // Build and execute query
    const result = yield builder
        .addLookups(lookups)
        .addRegexMatch("university.name", university)
        .addRegexMatch("division.name", division)
        .addRegexMatch("district.name", district)
        .addRegexMatch("thana.name", thana)
        .addRegexMatch("address.details", address)
        .addMatch("user.gender", gender)
        .addSearch(search, [
        "user.name",
        "guardianContact",
        "collegeName",
        "division.name",
        "district.name",
        "thana.name",
        "university.name"
    ])
        .addSort(sort)
        .addPagination(Number(page), Number(limit))
        .build()
        .execute();
    return result;
});
// ─── Get My Profile ─────────────────────────
const getMyProfile = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User ID is required");
    const profile = yield profile_model_1.Profile.findOne({ userId })
        .populate("userId", "name phone gender")
        .populate("universityId", "name")
        .populate("address.divisionId", "name")
        .populate("address.districtId", "name")
        .populate("address.thanaId", "name");
    if (!profile)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Profile not found");
    return profile;
});
// ─── Get Profile by ID ─────────────────────────
const getProfileById = (profileId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!profileId)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Profile ID is required");
    const profile = yield profile_model_1.Profile.findById(profileId)
        .populate("userId", "name phone gender")
        .populate("universityId", "name")
        .populate("address.divisionId", "name")
        .populate("address.districtId", "name")
        .populate("address.thanaId", "name");
    if (!profile)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Profile not found");
    return profile;
});
exports.ProfileService = {
    createProfile,
    updateProfile,
    getProfiles,
    getMyProfile,
    getProfileById
};
