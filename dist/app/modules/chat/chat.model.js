"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = void 0;
const mongoose_1 = require("mongoose");
const messageSchema = new mongoose_1.Schema({
    senderId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
        type: String,
        enum: ["text", "image", "file", "voice"],
        default: "text",
    },
    content: { type: String, required: true },
    status: {
        type: String,
        enum: ["sent", "delivered", "seen"],
        default: "sent",
    },
}, { timestamps: true });
exports.Message = (0, mongoose_1.model)("Message", messageSchema);
