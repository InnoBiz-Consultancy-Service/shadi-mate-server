import { Profile } from "./profile.model";

const createProfile = async (payload: any) => {
    if (!payload.universityId && !payload.collegeName) {
        throw new Error(
            "Either universityId or collegeName must be provided"
        );
    }

    const result = await Profile.create(payload);

    return result;
};

export const ProfileService = {
    createProfile,
};