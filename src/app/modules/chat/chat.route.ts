import express from "express";
import { getChatHistory, getConversationList } from "./chat.controller";
import authenticate from "../../../middleWares/auth.middleware";
const router = express.Router();

router.get("/conversations", authenticate, getConversationList);
router.get("/:userId", authenticate, getChatHistory);


export const ChatRoutes = router;