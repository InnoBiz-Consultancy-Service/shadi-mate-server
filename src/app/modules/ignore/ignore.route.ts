import { Router } from "express";
import { authenticate } from "../../../middleWares/auth.middleware";
import { IgnoreController } from "./ingore.controller";

const IgnoreRoutes = Router();

// ─── Ignore / Unignore toggle ─────────────────────────────────────────────────
// POST /api/v1/ignore/:userId
IgnoreRoutes.post("/:userId", authenticate, IgnoreController.toggleIgnore);

// ─── আমার ignore list ────────────────────────────────────────────────────────
// GET /api/v1/ignore
IgnoreRoutes.get("/", authenticate, IgnoreController.getMyIgnoreList);

// ─── Ignore status check ──────────────────────────────────────────────────────
// GET /api/v1/ignore/status/:userId
IgnoreRoutes.get("/status/:userId", authenticate, IgnoreController.checkIgnoreStatus);

// ─── Ignored conversation list ────────────────────────────────────────────────
// GET /api/v1/ignore/conversations
// Ignore করা user গুলোর মধ্যে কে কে message পাঠিয়েছে
IgnoreRoutes.get("/conversations", authenticate, IgnoreController.getIgnoredConversationList);

// ─── Ignored messages from a specific sender ──────────────────────────────────
// GET /api/v1/ignore/messages/:senderId?page=1&limit=20
IgnoreRoutes.get("/messages/:senderId", authenticate, IgnoreController.getIgnoredMessagesFromSender);

// ─── Delete ignored messages from a sender ────────────────────────────────────
// DELETE /api/v1/ignore/messages/:senderId
IgnoreRoutes.delete("/messages/:senderId", authenticate, IgnoreController.deleteIgnoredMessagesFromSender);

export default IgnoreRoutes;