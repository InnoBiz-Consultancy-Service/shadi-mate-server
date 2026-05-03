// services/dreamPartner.service.ts
import { StatusCodes } from "http-status-codes";
import { DreamPartnerPreference } from "./dreamPartner.model";
import { Profile } from "../profile/profile.model";
import AppError from "../../../helpers/AppError";
import { sendMatchEmail } from "../../../utils/mailer";
import { User } from "../user/user.model";
import mongoose from "mongoose";
import { extractCmFromDisplayHeight } from "../../../utils/heightConverter"; // ✅ import this

// Helper function to calculate age from birthDate
const calculateAge = (birthDate: Date | null | undefined): number => {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const savePreference = async (userId: string, payload: any) => {
    if (!userId) throw new AppError(StatusCodes.BAD_REQUEST, "User ID is required");

    const existing = await DreamPartnerPreference.findOne({ userId });

    if (existing) {
        return await DreamPartnerPreference.findOneAndUpdate(
            { userId },
            payload,
            { new: true, runValidators: true }
        );
    }

    return await DreamPartnerPreference.create({ userId, ...payload });
};

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
      meta: {
        page,
        limit,
        total: 0,
      },
      message: "Please set your dream partner preference first",
    };
  }

  const { 
    practiceLevel, 
    economicalStatus, 
    habits,
    agePreference,
    locationPreference,
    heightPreference 
  } = preference;

  const oppositeGender = userGender === "male" ? "female" : "male";

  const matches = await Profile.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },

    {
      $match: {
        userId: { $ne: new mongoose.Types.ObjectId(userId) },
        "user.gender": oppositeGender,
      },
    },

    {
      $addFields: {
        calculatedAge: {
          $floor: {
            $divide: [
              { $subtract: [new Date(), { $ifNull: ["$birthDate", new Date()] }] },
              31556952000
            ]
          }
        },
        // ✅ Extract cm from display height using MongoDB expression
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
            else: 0
          }
        }
      }
    },

    {
      $match: {
        ...(agePreference?.min && agePreference?.max && {
          calculatedAge: {
            $gte: agePreference.min,
            $lte: agePreference.max
          }
        }),
        ...(locationPreference?.divisionId && {
          "address.divisionId": new mongoose.Types.ObjectId(locationPreference.divisionId)
        }),
        // ✅ Use numeric height comparison
        ...(heightPreference?.min && heightPreference?.max && {
          heightCm: {
            $gte: parseInt(heightPreference.min),
            $lte: parseInt(heightPreference.max)
          }
        })
      }
    },

    {
      $addFields: {
        matchScore: {
          $add: [
            { $cond: [{ $eq: ["$religion.practiceLevel", practiceLevel] }, 1, 0] },
            { $cond: [{ $eq: ["$economicalStatus", economicalStatus] }, 1, 0] },
            {
              $cond: [
                { $gt: [{ $size: { $setIntersection: ["$habits", habits] } }, 0] },
                1,
                0,
              ],
            },
          ],
        },
      },
    },

    { $sort: { matchScore: -1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
  ]);

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

    const userId = profile.userId;
    
    const newProfileUser = await User.findById(userId).select("gender").lean();
    if (!newProfileUser?.gender) return;

    const newProfileGender = newProfileUser.gender;
    const receiverGender = newProfileGender === "male" ? "female" : "male";
    const newProfileAge = calculateAge(profile.birthDate);
    
    // ✅ Extract cm from display height using utility function
    const profileHeightCm = profile.height ? extractCmFromDisplayHeight(profile.height) : 0;

    const preferences = await DreamPartnerPreference.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user", 
      },
      {
        $match: {
          "user.gender": receiverGender,
          userId: {
            $ne: new mongoose.Types.ObjectId(userId),
          },
        },
      },
    ]);
    
    for (const pref of preferences) {
        let score = 0;
        let total = 6;

        if (pref.practiceLevel === profile.religion?.practiceLevel) score++;
        if (pref.economicalStatus === profile.economicalStatus) score++;
        if (
            pref.habits?.length &&
            profile.habits?.some((h: string) => pref.habits.includes(h))
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
            let locationMatch = false;
            if (pref.locationPreference.divisionId && 
                profile.address?.divisionId &&
                pref.locationPreference.divisionId.toString() === profile.address.divisionId.toString()) {
                locationMatch = true;
            }
            if (pref.locationPreference.districtId && 
                profile.address?.districtId &&
                pref.locationPreference.districtId.toString() === profile.address.districtId.toString()) {
                locationMatch = true;
            }
            if (locationMatch) score++;
        }
        
        // ✅ Use numeric cm values for height comparison
        if (
            pref.heightPreference &&
            profileHeightCm &&
            profileHeightCm >= parseInt(pref.heightPreference.min) &&
            profileHeightCm <= parseInt(pref.heightPreference.max)
        ) {
            score++;
        }

        const matchPercentage = (score / total) * 100;

        if (matchPercentage >= 40) {
            const user = pref.user;
            if (user?.email) {
                await sendMatchEmail({
                    to: user.email,
                    name: user.name,
                    profileId: profile.userId.toString(),
                    matchPercentage,
                });
            }
        }
    }
};

export const DreamPartnerService = {
    savePreference,
    findMatches,
    notifyMatchingUsers,
};