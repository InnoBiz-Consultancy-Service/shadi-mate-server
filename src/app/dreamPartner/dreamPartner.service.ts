// services/dreamPartner.service.ts
import { StatusCodes } from "http-status-codes";
import { DreamPartnerPreference } from "../dreamPartner/dreamPartner.model";
import { Profile } from "../modules/profile/profile.model";
import AppError from "../../helpers/AppError";

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

const findMatches = async (userId: string, page = 1, limit = 10) => {
    const preference = await DreamPartnerPreference.findOne({ userId });
    if (!preference) throw new AppError(StatusCodes.NOT_FOUND, "Dream Partner preference not found");

    const { practiceLevel, economicalStatus, habits } = preference;

    const matches = await Profile.aggregate([
        {
            $match: {
                _id: { $ne: userId } // নিজের profile বাদ দিবে
            }
        },
        {
            $addFields: {
                matchScore: {
                    $add: [
                        { $cond: [{ $eq: ["$religion.practiceLevel", practiceLevel] }, 1, 0] },
                        { $cond: [{ $eq: ["$economicalStatus", economicalStatus] }, 1, 0] },
                        { $cond: [{ $gt: [{ $size: { $setIntersection: ["$habits", habits] } }, 0] }, 1, 0] }
                    ]
                }
            }
        },
        { $sort: { matchScore: -1, "userId.name": 1 } }, // score অনুযায়ী descending
        { $skip: (page - 1) * limit },
        { $limit: limit },
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
                localField: "education.graduation.universityId",
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
    ]);

    return matches;
};

export const DreamPartnerService = {
    savePreference,
    findMatches,
};