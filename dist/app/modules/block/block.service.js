"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockService = void 0;
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../../helpers/AppError"));
const block_model_1 = require("./block.model");
const user_model_1 = require("../user/user.model");
// ─── Toggle Block / Unblock ───────────────────────────────────────────────────
const toggleBlock = (blockerId, blockedId) => __awaiter(void 0, void 0, void 0, function* () {
    if (blockerId === blockedId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "You cannot block yourself");
    }
    const targetUser = yield user_model_1.User.findOne({
        _id: blockedId,
        isDeleted: false,
    }).lean();
    if (!targetUser) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    const existing = yield block_model_1.Block.findOne({ blockerId, blockedId });
    let action;
    if (existing) {
        yield block_model_1.Block.deleteOne({ _id: existing._id });
        action = "unblocked";
    }
    else {
        yield block_model_1.Block.create({ blockerId, blockedId });
        action = "blocked";
    }
    return { action };
});
// ─── Check: দুইজনের মধ্যে কোনো block আছে কিনা ────────────────────────────────
// chat handler থেকে call হবে — message পাঠানোর আগে check করতে
const isBlockedBetween = (userAId, userBId) => __awaiter(void 0, void 0, void 0, function* () {
    // A ব্লক করেছে B কে, অথবা B ব্লক করেছে A কে — যেকোনোটা হলেই true
    const record = yield block_model_1.Block.findOne({
        $or: [
            { blockerId: userAId, blockedId: userBId },
            { blockerId: userBId, blockedId: userAId },
        ],
    }).lean();
    return !!record;
});
// ─── Block Status Check ───────────────────────────────────────────────────────
const getBlockStatus = (blockerId, targetId) => __awaiter(void 0, void 0, void 0, function* () {
    const iBlockedThem = yield block_model_1.Block.findOne({ blockerId, blockedId: targetId }).lean();
    const theyBlockedMe = yield block_model_1.Block.findOne({ blockerId: targetId, blockedId: blockerId }).lean();
    return {
        iBlockedThem: !!iBlockedThem,
        theyBlockedMe: !!theyBlockedMe,
        isBlocked: !!(iBlockedThem || theyBlockedMe),
    };
});
// ─── Get My Block List ────────────────────────────────────────────────────────
const getMyBlockList = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const blocks = yield block_model_1.Block.find({ blockerId: userId })
        .sort({ createdAt: -1 })
        .populate("blockedId", "name _id")
        .lean();
    return blocks.map((b) => ({
        userId: b.blockedId._id,
        name: b.blockedId.name,
        blockedAt: b.createdAt,
    }));
});
exports.BlockService = {
    toggleBlock,
    isBlockedBetween,
    getBlockStatus,
    getMyBlockList,
};
