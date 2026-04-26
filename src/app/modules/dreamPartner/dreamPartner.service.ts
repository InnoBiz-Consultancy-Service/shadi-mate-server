// services/dreamPartner.service.ts
import { StatusCodes } from "http-status-codes";
import { DreamPartnerPreference } from "./dreamPartner.model";
import { Profile } from "../profile/profile.model";
import AppError from "../../../helpers/AppError";
import { sendMatchEmail } from "../../../utils/mailer";
import { User } from "../user/user.model";
import mongoose from "mongoose";

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



// dreamPartner.service.ts
const findMatches = async (userId: string, userGender: string, page = 1, limit = 10) => {
  const preference = await DreamPartnerPreference.findOne({ userId });
  if (!preference) throw new AppError(StatusCodes.NOT_FOUND, "Dream Partner preference not found");

  const { practiceLevel, economicalStatus, habits } = preference;

  // ✅ Opposite gender
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
    {
      $match: {
        "userId": { $ne: new mongoose.Types.ObjectId(userId) },
        "user.gender": oppositeGender, // ✅
      },
    },
    {
      $addFields: {
        matchScore: {
          $add: [
            { $cond: [{ $eq: ["$religion.practiceLevel", practiceLevel] }, 1, 0] },
            { $cond: [{ $eq: ["$economicalStatus", economicalStatus] }, 1, 0] },
            { $cond: [{ $gt: [{ $size: { $setIntersection: ["$habits", habits] } }, 0] }, 1, 0] },
          ],
        },
      },
    },
    { $sort: { matchScore: -1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
    { $lookup: { from: "universities", localField: "education.graduation.universityId", foreignField: "_id", as: "university" } },
    { $lookup: { from: "divisions", localField: "address.divisionId", foreignField: "_id", as: "division" } },
    { $lookup: { from: "districts", localField: "address.districtId", foreignField: "_id", as: "district" } },
    { $lookup: { from: "thanas", localField: "address.thanaId", foreignField: "_id", as: "thana" } },
  ]);

  return matches;
};
const notifyMatchingUsers = async (profile: any) => {
    const newProfileUser = await User.findById(profile.userId).select("gender").lean();
    if (!newProfileUser?.gender) return;

    const newProfileGender = newProfileUser.gender;
    const receiverGender = newProfileGender === "male" ? "female" : "male";

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
           
            $match: {
                "user.gender": receiverGender,
                "userId": { $ne: new mongoose.Types.ObjectId(profile.userId.toString()) },
            },
        },
    ]);

    for (const pref of preferences) {
        let score = 0;
        const total = 3;

        if (pref.practiceLevel === profile.religion?.practiceLevel) score++;
        if (pref.economicalStatus === profile.economicalStatus) score++;
        if (
            pref.habits?.length &&
            profile.habits?.some((h: string) => pref.habits.includes(h))
        ) {
            score++;
        }

        const matchPercentage = (score / total) * 100;

        if (matchPercentage >= 40) {
            const user = pref.user?.[0];

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