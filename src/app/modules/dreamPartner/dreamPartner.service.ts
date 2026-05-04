// src/app/modules/dreamPartner/dreamPartner.service.ts — OPTIMIZED
// EXTRA CHANGE: $match কে $lookup এর আগে নিয়ে এলাম
// আগে: সব profiles lookup করে তারপর filter → বেশি data process
// এখন: আগে gender+userId filter, তারপর lookup → কম data process

import { StatusCodes }          from "http-status-codes";
import { DreamPartnerPreference } from "./dreamPartner.model";
import { Profile }               from "../profile/profile.model";
import AppError                  from "../../../helpers/AppError";
import { sendMatchEmail }        from "../../../utils/mailer";
import { User }                  from "../user/user.model";
import mongoose                  from "mongoose";
import { extractCmFromDisplayHeight } from "../../../utils/heightConverter";

const savePreference = async (userId: string, payload: any) => {
  if (!userId) throw new AppError(StatusCodes.BAD_REQUEST, "User ID is required");

  const existing = await DreamPartnerPreference.findOne({ userId });
  if (existing) {
    return await DreamPartnerPreference.findOneAndUpdate(
      { userId }, payload, { new: true, runValidators: true }
    );
  }
  return await DreamPartnerPreference.create({ userId, ...payload });
};

// ── EXTRA CHANGE: Optimized findMatches aggregation ───────────────────────────
// আগের pipeline:
//   1. $lookup users (সব profiles এর জন্য)
//   2. $unwind
//   3. $match (gender filter) ← late filtering = বেশি data process
//
// এখন:
//   1. Profile collection এ আগেই userId filter + আলাদা users lookup
//   2. $match আগে → কম documents process হয়
const findMatches = async (
  userId: string,
  userGender: string,
  page = 1,
  limit = 10
) => {
  const preference = await DreamPartnerPreference.findOne({ userId });

  if (!preference) {
    return {
      data: [],
      meta: { page, limit, total: 0 },
      message: "Please set your dream partner preference first",
    };
  }

  const {
    practiceLevel,
    economicalStatus,
    habits,
    agePreference,
    locationPreference,
    heightPreference,
  } = preference;

  const oppositeGender = userGender === "male" ? "female" : "male";
  const myId = new mongoose.Types.ObjectId(userId);

  const pipeline: any[] = [];

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
  const matchConditions: any = {};

  if (agePreference?.min && agePreference?.max) {
    matchConditions.calculatedAge = {
      $gte: agePreference.min,
      $lte: agePreference.max,
    };
  }

  if (locationPreference?.divisionId) {
    matchConditions["address.divisionId"] =
      new mongoose.Types.ObjectId(locationPreference.divisionId);
  }

  if (locationPreference?.districtId) {
    matchConditions["address.districtId"] =
      new mongoose.Types.ObjectId(locationPreference.districtId);
  }

  if (heightPreference?.min && heightPreference?.max) {
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
  pipeline.push(
    { $sort: { matchScore: -1, createdAt: -1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit }
  );

  const matches = await Profile.aggregate(pipeline);

  return {
    data: matches,
    meta: {
      page,
      limit,
      total: matches.length,
    },
  };
};

const notifyMatchingUsers = async (profile: any) => {
  if (!profile) return;

  const newUser = await User.findById(profile.userId)
    .select("gender name")
    .lean();

  if (!newUser?.gender) return;

  const receiverGender =
    newUser.gender === "male" ? "female" : "male";

  // ✅ SAFE AGE
  const newProfileAge = calculateAge(profile.birthDate);

  if (typeof newProfileAge !== "number") return;

  // ✅ SAFE HEIGHT
  const profileHeightCm = profile.height
    ? extractCmFromDisplayHeight(profile.height)
    : null;

  // 🔥 DB FILTERING
  const preferences = await DreamPartnerPreference.aggregate([
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
      $match: {
        ...(newProfileAge && {
          "agePreference.min": { $lte: newProfileAge },
          "agePreference.max": { $gte: newProfileAge },
        }),
      },
    },

    { $limit: 100 },
  ]);

  // 🔥 SCORE + EMAIL
  const emailJobs = preferences.map((pref: any) => {
    let score = 0;
    const total = 6;

    if (pref.practiceLevel === profile.religion?.practiceLevel)
      score++;

    if (pref.economicalStatus === profile.economicalStatus)
      score++;

    if (
      pref.habits?.length &&
      profile.habits?.some((h: string) =>
        pref.habits.includes(h)
      )
    ) {
      score++;
    }

    if (
      pref.agePreference &&
      newProfileAge >= pref.agePreference.min &&
      newProfileAge <= pref.agePreference.max
    ) {
      score++;
    }

    if (pref.locationPreference) {
      let match = false;

      if (
        pref.locationPreference.divisionId &&
        profile.address?.divisionId &&
        pref.locationPreference.divisionId.toString() ===
          profile.address.divisionId.toString()
      ) {
        match = true;
      }

      if (
        pref.locationPreference.districtId &&
        profile.address?.districtId &&
        pref.locationPreference.districtId.toString() ===
          profile.address.districtId.toString()
      ) {
        match = true;
      }

      if (match) score++;
    }

    if (
      pref.heightPreference &&
      profileHeightCm &&
      profileHeightCm >= parseInt(pref.heightPreference.min) &&
      profileHeightCm <= parseInt(pref.heightPreference.max)
    ) {
      score++;
    }

    const matchPercentage = (score / total) * 100;

    if (matchPercentage >= 40 && pref.user?.email) {
      return sendMatchEmail({
        to: pref.user.email,
        name: pref.user.name,
        profileId: profile.userId.toString(),
        matchPercentage,
      });
    }

    return null;
  });

  await Promise.allSettled(emailJobs.filter(Boolean));
};

export const DreamPartnerService = {
  savePreference,
  findMatches,
  notifyMatchingUsers,
};
export const calculateAge = (
  birthDate: Date | string | null | undefined
): number => {
  if (!birthDate) return 0;

  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return 0;

  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();

  const monthDiff = today.getMonth() - birth.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birth.getDate())
  ) {
    age--;
  }

  return age;
};
