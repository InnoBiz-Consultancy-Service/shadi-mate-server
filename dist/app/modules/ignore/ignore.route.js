"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middleWares/auth.middleware");
const ingore_controller_1 = require("./ingore.controller");
const IgnoreRoutes = (0, express_1.Router)();
// ─── Ignore / Unignore toggle ─────────────────────────────────────────────────
// POST /api/v1/ignore/:userId
IgnoreRoutes.post("/:userId", auth_middleware_1.authenticate, ingore_controller_1.IgnoreController.toggleIgnore);
// ─── আমার ignore list ────────────────────────────────────────────────────────
// GET /api/v1/ignore
IgnoreRoutes.get("/", auth_middleware_1.authenticate, ingore_controller_1.IgnoreController.getMyIgnoreList);
// ─── Ignore status check ──────────────────────────────────────────────────────
// GET /api/v1/ignore/status/:userId
IgnoreRoutes.get("/status/:userId", auth_middleware_1.authenticate, ingore_controller_1.IgnoreController.checkIgnoreStatus);
// ─── Ignored conversation list ────────────────────────────────────────────────
// GET /api/v1/ignore/conversations
// Ignore করা user গুলোর মধ্যে কে কে message পাঠিয়েছে
IgnoreRoutes.get("/conversations", auth_middleware_1.authenticate, ingore_controller_1.IgnoreController.getIgnoredConversationList);
// ─── Ignored messages from a specific sender ──────────────────────────────────
// GET /api/v1/ignore/messages/:senderId?page=1&limit=20
IgnoreRoutes.get("/messages/:senderId", auth_middleware_1.authenticate, ingore_controller_1.IgnoreController.getIgnoredMessagesFromSender);
// ─── Delete ignored messages from a sender ────────────────────────────────────
// DELETE /api/v1/ignore/messages/:senderId
IgnoreRoutes.delete("/messages/:senderId", auth_middleware_1.authenticate, ingore_controller_1.IgnoreController.deleteIgnoredMessagesFromSender);
exports.default = IgnoreRoutes;
