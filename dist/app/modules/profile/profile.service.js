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
    const existing = yield profile_model_1.Profile.findOne({ userId });
    if (existing) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Profile already exists");
    }
    const profile = yield profile_model_1.Profile.create(Object.assign(Object.assign({}, payload), { userId }));
    const completed = checkProfileCompletion(payload);
    yield user_model_1.User.findByIdAndUpdate(userId, {
        isProfileCompleted: completed
    });
    return profile;
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
exports.ProfileService = {
    createProfile,
    updateProfile
};
