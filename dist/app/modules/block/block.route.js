"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const block_controller_1 = require("./block.controller");
const auth_middleware_1 = __importDefault(require("../../../middleWares/auth.middleware"));
const BlockRoutes = (0, express_1.Router)();
// POST /api/v1/block/:userId — Toggle block/unblock
BlockRoutes.post("/:userId", auth_middleware_1.default, block_controller_1.BlockController.toggleBlock);
// GET /api/v1/block — আমার block list
BlockRoutes.get("/", auth_middleware_1.default, block_controller_1.BlockController.getMyBlockList);
// GET /api/v1/block/status/:userId — block status check
BlockRoutes.get("/status/:userId", auth_middleware_1.default, block_controller_1.BlockController.getBlockStatus);
exports.default = BlockRoutes;
