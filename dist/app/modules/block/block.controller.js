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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = require("../../../utils/catchAsync");
const sendResponse_1 = require("../../../utils/sendResponse");
const block_service_1 = require("./block.service");
// ─── Toggle Block / Unblock ───────────────────────────────────────────────────
const toggleBlock = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const blockerId = req.user.id;
    const blockedId = req.params.userId;
    const result = yield block_service_1.BlockService.toggleBlock(blockerId, blockedId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: result.action === "blocked"
            ? "User blocked successfully"
            : "User unblocked successfully",
        data: { action: result.action },
    });
}));
// ─── Get Block Status ─────────────────────────────────────────────────────────
const getBlockStatus = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const blockerId = req.user.id;
    const targetId = req.params.userId;
    const result = yield block_service_1.BlockService.getBlockStatus(blockerId, targetId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Block status fetched",
        data: result,
    });
}));
// ─── Get My Block List ────────────────────────────────────────────────────────
const getMyBlockList = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const result = yield block_service_1.BlockService.getMyBlockList(userId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Block list fetched successfully",
        data: result,
    });
}));
exports.BlockController = {
    toggleBlock,
    getBlockStatus,
    getMyBlockList,
};
