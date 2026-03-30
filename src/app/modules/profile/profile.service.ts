import AppError from "../../../helpers/AppError";
import { StatusCodes } from "http-status-codes";
import { Profile } from "./profile.model";
import { User } from "../user/user.model";
import { AggregationBuilder } from "../../../utils/profileQueryBuilder";
import { QueryParams } from "./profile.interface";
import { invalidateProfileCache } from "../like/like.servce";
import { calculateCompletionPercentage, getCompletionLabel } from "./profileCompletaion";

// ─── Profile Completion Check (boolean — isProfileCompleted flag এর জন্য) ─────
const checkProfileCompletion = (profile: any) => {
    return !!(
        profile.gender &&
        profile.address?.divisionId &&
        profile.address?.districtId &&
        profile.address?.details &&
        profile.religion?.faith &&
        profile.religion?.practiceLevel &&
        profile.personality &&
        profile.profession &&
        profile.habits
    );
};

// ─── Create Profile ───────────────────────────────────────────────────────────
const createProfile = async (userId: string, payload: any) => {
    if (!userId) {
        throw new AppError(StatusCodes.BAD_REQUEST, "User ID is required");
    }

    const profile = await Profile.create({ ...payload, userId });

    const completed = checkProfileCompletion(profile);
    await User.findByIdAndUpdate(userId, { isProfileCompleted: completed });

    // ─── Cache invalidate ─────────────────────────────────────────────────────
    await invalidateProfileCache(userId);

    return profile;
};

// ─── Update Profile ───────────────────────────────────────────────────────────
const updateProfile = async (userId: string, payload: any) => {
    const profile = await Profile.findOneAndUpdate(
        { userId },
        payload,
        { new: true, runValidators: true }
    );

    if (!profile) {
        throw new AppError(StatusCodes.NOT_FOUND, "Profile not found");
    }

    const completed = checkProfileCompletion(profile);
    await User.findByIdAndUpdate(userId, { isProfileCompleted: completed });

    await invalidateProfileCache(userId);

    return profile;
};

// ─── Get Profiles (Search + Filter) ──────────────────────────────────────────
const getProfiles = async (
    query: QueryParams & {
        minAge?: number;
        maxAge?: number;
        educationVariety?: string;
        faith?: string;
        practiceLevel?: string;
        personality?: string;
        habits?: string[];
    }
) => {
    const {
        search,
        university,
        division,
        district,
        thana,
        gender,
        minAge,
        maxAge,
        educationVariety,
        faith,
        practiceLevel,
        personality,
        habits,
        page = 1,
        limit = 10,
        sort = "-createdAt",
    } = query;

    const builder = new AggregationBuilder(Profile);

    const lookups = [
        { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
        { $lookup: { from: "universities", localField: "education.graduation.universityId", foreignField: "_id", as: "university" } },
        { $lookup: { from: "divisions", localField: "address.divisionId", foreignField: "_id", as: "division" } },
        { $lookup: { from: "districts", localField: "address.districtId", foreignField: "_id", as: "district" } },
        { $lookup: { from: "thanas", localField: "address.thanaId", foreignField: "_id", as: "thana" } },
    ];

    builder.addLookups(lookups);

    builder
        .addRegexMatch("university.name", university as string)
        .addRegexMatch("division.name", division as string)
        .addRegexMatch("district.name", district as string)
        .addRegexMatch("thana.name", thana as string)
        .addMatch("user.gender", gender as string);

    if (educationVariety) builder.addMatch("education.graduation.variety", educationVariety);
    if (faith) builder.addMatch("religion.faith", faith);
    if (practiceLevel) builder.addMatch("religion.practiceLevel", practiceLevel);
    if (personality) builder.addMatch("personality", personality);
    if (habits?.length) builder.addMatch("habits", { $in: habits });

    if (minAge || maxAge) {
        const now = new Date();
        const ageFilter: any = {};
        if (minAge) ageFilter.$lte = new Date(now.getFullYear() - minAge, now.getMonth(), now.getDate());
        if (maxAge) ageFilter.$gte = new Date(now.getFullYear() - maxAge, now.getMonth(), now.getDate());
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

    const result = await builder
        .addSort(sort)
        .addPagination(Number(page), Number(limit))
        .build()
        .execute();

    return result;
};

// ─── Get My Profile ───────────────────────────────────────────────────────────
const getMyProfile = async (userId: string) => {
    if (!userId) throw new AppError(StatusCodes.BAD_REQUEST, "User ID is required");

    const [profile, user] = await Promise.all([
        Profile.findOne({ userId })
            .populate("userId", "name phone email gender")
            .populate("address.divisionId", "name")
            .populate("address.districtId", "name")
            .populate("address.thanaId", "name")
            .lean(),
        User.findById(userId).lean(),
    ]);

    if (!profile) throw new AppError(StatusCodes.NOT_FOUND, "Profile not found");

    // ─── Completion percentage ────────────────────────────────────────────────
    const completion = calculateCompletionPercentage(user, profile);

    return {
        ...profile,
        completionPercentage: completion.percentage,
        completionLabel: getCompletionLabel(completion.percentage),
        missingFields: completion.missingFields.map((f) => ({
            key: f.key,
            label: f.label,
        })),
    };
};

// ─── Get Profile by ID ────────────────────────────────────────────────────────
const getProfileById = async (profileId: string, requestUserId?: string) => {
    if (!profileId) throw new AppError(StatusCodes.BAD_REQUEST, "Profile ID is required");

    const profile = await Profile.findById(profileId)
        .populate("userId", "name phone gender")
        .populate("address.divisionId", "name")
        .populate("address.districtId", "name")
        .populate("address.thanaId", "name")
        .lean();

    if (!profile) throw new AppError(StatusCodes.NOT_FOUND, "Profile not found");

    const profileUserId = (profile.userId as any)?._id?.toString();
    if (requestUserId && profileUserId === requestUserId) {
        const user = await User.findById(requestUserId).lean();
        const completion = calculateCompletionPercentage(user, profile);

        return {
            ...profile,
            completionPercentage: completion.percentage,
            completionLabel: getCompletionLabel(completion.percentage),
            missingFields: completion.missingFields.map((f) => ({
                key: f.key,
                label: f.label,
            })),
        };
    }

    return profile;
};

export const ProfileService = {
    createProfile,
    updateProfile,
    getProfiles,
    getMyProfile,
    getProfileById,
};