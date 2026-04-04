import { StatusCodes } from "http-status-codes";
import AppError from "../../../helpers/AppError";
import { ProfileVisit } from "./profileVisit.model";
import { User } from "../user/user.model";
import { NotificationService } from "../notification/notification.service";
import { redisClient } from "../../../utils/redis";
import { getIO } from "../../../socket/handlers/socketSingleton";

// ─── Record Profile Visit ─────────────────────────────────────────────────────
// profile.service.ts এর getProfileById থেকে call হবে
const recordVisit = async (visitorId: string, profileOwnerId: string) => {
    // নিজের profile visit log হবে না
    if (visitorId === profileOwnerId) return;

    // ─── Upsert: same visitor+owner থাকলে visitCount++ এবং visitedAt update ──
    await ProfileVisit.findOneAndUpdate(
        { visitorId, profileOwnerId },
        {
            $inc: { visitCount: 1 },
            $set: { visitedAt: new Date() },
        },
        { upsert: true, new: true }
    );

    // ─── Profile owner কে notification পাঠাও ─────────────────────────────────
    try {
        const visitor = await User.findById(visitorId).select("name").lean();
        const visitorName = visitor?.name ?? "Someone";

        await NotificationService.createAndDeliver({
            io: getIO(),
            redisClient,
            recipientId: profileOwnerId,
            senderId: visitorId,
            senderName: visitorName,
            type: "profile_visit",
            metadata: {
                conversationWith: visitorId,
            },
        });
    } catch (err) {
        // Notification fail হলেও visit log block হবে না
        console.error("❌ Profile visit notification error:", err);
    }
};

// ─── Get Who Visited My Profile (Premium Only) ───────────────────────────────
const getProfileVisitors = async (
    profileOwnerId: string,
    subscription: string,
    page = 1,
    limit = 20
) => {
    if (subscription !== "premium") {
        throw new AppError(
            StatusCodes.FORBIDDEN,
            "Upgrade to premium to see who visited your profile"
        );
    }

    const skip = (page - 1) * limit;

    const [visitors, total] = await Promise.all([
        ProfileVisit.find({ profileOwnerId })
            .sort({ visitedAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("visitorId", "name _id")
            .lean(),
        ProfileVisit.countDocuments({ profileOwnerId }),
    ]);

    const result = visitors.map((v: any) => ({
        userId: v.visitorId._id,
        name: v.visitorId.name,
        visitCount: v.visitCount,
        visitedAt: v.visitedAt,
    }));

    return {
        visitors: result,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};

// ─── Get Total Visit Count (Free & Premium) ───────────────────────────────────
const getVisitCount = async (profileOwnerId: string) => {
    const count = await ProfileVisit.countDocuments({ profileOwnerId });
    return { count };
};

export const ProfileVisitService = {
    recordVisit,
    getProfileVisitors,
    getVisitCount,
};