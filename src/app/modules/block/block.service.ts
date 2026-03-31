import { StatusCodes } from "http-status-codes";
import AppError from "../../../helpers/AppError";
import { Block } from "./block.model";
import { User } from "../user/user.model";

// ─── Toggle Block / Unblock ───────────────────────────────────────────────────
const toggleBlock = async (blockerId: string, blockedId: string) => {
    if (blockerId === blockedId) {
        throw new AppError(StatusCodes.BAD_REQUEST, "You cannot block yourself");
    }

    const targetUser = await User.findOne({
        _id: blockedId,
        isDeleted: false,
    }).lean();

    if (!targetUser) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }

    const existing = await Block.findOne({ blockerId, blockedId });

    let action: "blocked" | "unblocked";

    if (existing) {
        await Block.deleteOne({ _id: existing._id });
        action = "unblocked";
    } else {
        await Block.create({ blockerId, blockedId });
        action = "blocked";
    }

    return { action };
};

// ─── Check: দুইজনের মধ্যে কোনো block আছে কিনা ────────────────────────────────
// chat handler থেকে call হবে — message পাঠানোর আগে check করতে
const isBlockedBetween = async (
    userAId: string,
    userBId: string
): Promise<boolean> => {
    // A ব্লক করেছে B কে, অথবা B ব্লক করেছে A কে — যেকোনোটা হলেই true
    const record = await Block.findOne({
        $or: [
            { blockerId: userAId, blockedId: userBId },
            { blockerId: userBId, blockedId: userAId },
        ],
    }).lean();

    return !!record;
};

// ─── Block Status Check ───────────────────────────────────────────────────────
const getBlockStatus = async (blockerId: string, targetId: string) => {
    const iBlockedThem = await Block.findOne({ blockerId, blockedId: targetId }).lean();
    const theyBlockedMe = await Block.findOne({ blockerId: targetId, blockedId: blockerId }).lean();

    return {
        iBlockedThem: !!iBlockedThem,
        theyBlockedMe: !!theyBlockedMe,
        isBlocked: !!(iBlockedThem || theyBlockedMe),
    };
};

// ─── Get My Block List ────────────────────────────────────────────────────────
const getMyBlockList = async (userId: string) => {
    const blocks = await Block.find({ blockerId: userId })
        .sort({ createdAt: -1 })
        .populate("blockedId", "name _id")
        .lean();

    return blocks.map((b: any) => ({
        userId: b.blockedId._id,
        name: b.blockedId.name,
        blockedAt: b.createdAt,
    }));
};

export const BlockService = {
    toggleBlock,
    isBlockedBetween,
    getBlockStatus,
    getMyBlockList,
};