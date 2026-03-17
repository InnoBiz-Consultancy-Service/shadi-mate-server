import AppError from "../../../helpers/AppError";
import { StatusCodes } from "http-status-codes";
import { Profile } from "./profile.model";
import { User } from "../user/user.model";
import { AggregationBuilder } from "../../../utils/profileQueryBuilder";
import { QueryParams } from "./profile.interface";

const checkProfileCompletion = (payload: any) => {

    if (
        payload.gender &&
        payload.guardianContact &&
        payload.relation &&
        payload.address?.divisionId &&
        payload.address?.districtId &&
        payload.address?.thanaId &&
        payload.address?.details &&
        (payload.universityId || payload.collegeName)
    ) {
        return true;
    }

    return false;
};

// ─── Create Profile ─────────────────────────

const createProfile = async (userId: string, payload: any) => {
    if (!userId) throw new AppError(StatusCodes.BAD_REQUEST, "User ID is required");

    const existing = await Profile.findOne({ userId });

    if (existing) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Profile already exists");
    }

    const profile = await Profile.create({
        ...payload,
        userId
    });

    const completed = checkProfileCompletion(payload);

    await User.findByIdAndUpdate(userId, {
        isProfileCompleted: completed
    });

    return profile;
};


// ─── Update Profile ─────────────────────────

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

    await User.findByIdAndUpdate(userId, {
        isProfileCompleted: completed
    });

    return profile;
};


const getProfiles = async (query: QueryParams) => {
    const {
        search,
        university,
        division,
        district,
        thana,
        gender,
        address,
        page = 1,
        limit = 10,
        sort = "-createdAt",
    } = query;

    const builder = new AggregationBuilder(Profile);

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
    const result = await builder
        .addLookups(lookups)
        .addRegexMatch("university.name", university as string)
        .addRegexMatch("division.name", division as string)
        .addRegexMatch("district.name", district as string)
        .addRegexMatch("thana.name", thana as string)
        .addRegexMatch("address.details", address as string)
        .addMatch("user.gender", gender as string)
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
};
// ─── Get My Profile ─────────────────────────
const getMyProfile = async (userId: string) => {
    if (!userId) throw new AppError(StatusCodes.BAD_REQUEST, "User ID is required");

    const profile = await Profile.findOne({ userId })
        .populate("userId", "name phone gender")
        .populate("universityId", "name")
        .populate("address.divisionId", "name")
        .populate("address.districtId", "name")
        .populate("address.thanaId", "name");

    if (!profile) throw new AppError(StatusCodes.NOT_FOUND, "Profile not found");

    return profile;
};

// ─── Get Profile by ID ─────────────────────────
const getProfileById = async (profileId: string) => {
    if (!profileId) throw new AppError(StatusCodes.BAD_REQUEST, "Profile ID is required");

    const profile = await Profile.findById(profileId)
        .populate("userId", "name phone gender")
        .populate("universityId", "name")
        .populate("address.divisionId", "name")
        .populate("address.districtId", "name")
        .populate("address.thanaId", "name");

    if (!profile) throw new AppError(StatusCodes.NOT_FOUND, "Profile not found");

    return profile;
};

export const ProfileService = {
    createProfile,
    updateProfile,
    getProfiles,
    getMyProfile,
    getProfileById
};