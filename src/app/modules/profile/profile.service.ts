// profile.service.ts
import AppError from "../../../helpers/AppError";
import { StatusCodes } from "http-status-codes";
import { Profile } from "./profile.model";
import { User } from "../user/user.model";
import { AggregationBuilder } from "../../../utils/profileQueryBuilder";
import { QueryParams } from "./profile.interface";
import { invalidateProfileCache } from "../like/like.servce";
import { calculateCompletionPercentage, getCompletionLabel } from "./profileCompletaion";
import { Types } from "mongoose";
import { DreamPartnerService } from "../dreamPartner/dreamPartner.service";
import { toDisplayHeight, extractCmFromDisplayHeight } from "../../../utils/heightConverter";

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

    // Convert height if present
    let processedPayload = { ...payload };
    if (payload.height !== undefined && payload.height !== null) {
        processedPayload.height = toDisplayHeight(payload.height);
    }

    const profile = await Profile.create({ ...processedPayload, userId });

    const completed = checkProfileCompletion(profile);
    await User.findByIdAndUpdate(userId, { isProfileCompleted: completed });

    // ─── Cache invalidate ─────────────────────────────────────────────────────
    await invalidateProfileCache(userId);

    try {
        await DreamPartnerService.notifyMatchingUsers(profile);
    } catch (err) {
        console.log("❌ match email error:", err);
    }

    return profile;
};

// ─── Update Profile ───────────────────────────────────────────────────────────
const updateProfile = async (userId: string, payload: any) => {
    const updateData = { ...payload };

    // Convert height if present
    if (payload.height !== undefined && payload.height !== null) {
        updateData.height = toDisplayHeight(payload.height);
    }

    // ❗ undefined field remove করো
    Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined) {
            delete updateData[key];
        }
    });

    const profile = await Profile.findOneAndUpdate(
        { userId },
        updateData,
        { new: true, runValidators: true }
    );

    if (!profile) {
        throw new AppError(StatusCodes.NOT_FOUND, "Profile not found");
    }

    return profile;
};

// ─── Get Profiles (Search + Filter) ──────────────────────────────────────────
// profile.service.ts - Updated getProfiles function with height filter

const getProfiles = async (
  query: QueryParams & {
    minAge?: number;
    maxAge?: number;
    educationVariety?: string;
    faith?: string;
    practiceLevel?: string;
    personality?: string;
    habits?: string[];
    minHeight?: number; // in cm
    maxHeight?: number; // in cm
  },
  currentUserId: string,
  currentUserGender: string,
) => {
  const {
    search, university, division, district, thana,
    minAge, maxAge, educationVariety, faith, practiceLevel,
    personality, habits, minHeight, maxHeight,
    page = 1, limit = 10, sort = "-createdAt",
  } = query;

  // ✅ Opposite gender calculate
  const oppositeGender = currentUserGender === "male" ? "female" : "male";

  const builder = new AggregationBuilder(Profile);

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

  builder.addMatch("userId", { $ne: new Types.ObjectId(currentUserId) });
  builder.addMatch("user.gender", oppositeGender);

  builder
    .addRegexMatch("university.name", university as string)
    .addRegexMatch("division.name", division as string)
    .addRegexMatch("district.name", district as string)
    .addRegexMatch("thana.name", thana as string);

  if (educationVariety) builder.addMatch("education.graduation.variety", educationVariety);
  if (faith) builder.addMatch("religion.faith", faith);
  if (practiceLevel) builder.addMatch("religion.practiceLevel", practiceLevel);
  if (personality) builder.addMatch("personality", personality);
  if (habits?.length) builder.addMatch("habits", { $in: habits });

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

  const results = await builder
    .addSort(sort)
    .addPagination(Number(page), Number(limit))
    .build()
    .execute();
    
  // Remove temporary heightCm field from results if needed
  if (results.data) {
    results.data = results.data.map((item: any) => {
      if (item.heightCm !== undefined) {
        delete item.heightCm;
      }
      return item;
    });
  }
    
  return results;
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

export const getProfileByUserIdFromDB = async (userId: string) => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid user ID");
  }

  const profile = await Profile.findOne({ userId })
    .populate("userId", "name email")
    .lean();

  if (!profile) {
    throw new AppError(StatusCodes.NOT_FOUND, "Profile not found");
  }

  return profile;
};

export const ProfileService = {
    createProfile,
    updateProfile,
    getProfiles,
    getMyProfile,
    getProfileByUserIdFromDB
};