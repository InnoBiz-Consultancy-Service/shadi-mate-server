import { Router } from "express";
import { authenticate } from "../../../middleWares/auth.middleware";
import { BlockController } from "./block.controller";

const BlockRoutes = Router();

// POST /api/v1/block/:userId — Toggle block/unblock
BlockRoutes.post("/:userId", authenticate, BlockController.toggleBlock);

// GET /api/v1/block — আমার block list
BlockRoutes.get("/", authenticate, BlockController.getMyBlockList);

// GET /api/v1/block/status/:userId — block status check
BlockRoutes.get("/status/:userId", authenticate, BlockController.getBlockStatus);

export default BlockRoutes;