import express from "express";
import { getChatHistory, getConversationList } from "./chat.controller";
import { authenticate } from "../../../middleWares/auth.middleware";

const router = express.Router();

// GET /api/chat/history/:userId  → chat history with a specific user
router.get("/history/:userId", authenticate, getChatHistory);

// GET /api/chat/conversations  → list of all conversations for logged-in user
router.get("/conversations", authenticate, getConversationList);

export const ChatRoutes = router;