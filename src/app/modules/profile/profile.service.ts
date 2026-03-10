import AppError from "../../../helpers/AppError";
import { StatusCodes } from "http-status-codes";
import { Profile } from "./profile.model";
import { User } from "../user/user.model";

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


export const ProfileService = {
    createProfile,
    updateProfile
};