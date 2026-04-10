"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRoutes = void 0;
const express_1 = __importDefault(require("express"));
const chat_controller_1 = require("./chat.controller");
const auth_middleware_1 = __importDefault(require("../../../middleWares/auth.middleware"));
const router = express_1.default.Router();
router.get("/conversations", auth_middleware_1.default, chat_controller_1.getConversationList);
router.get("/:userId", auth_middleware_1.default, chat_controller_1.getChatHistory);
exports.ChatRoutes = router;
