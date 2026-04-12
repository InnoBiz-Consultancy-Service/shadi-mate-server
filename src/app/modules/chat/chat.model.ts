import { Schema, model } from "mongoose";

// ─── Message Schema ───────────────────────────────────────────────────────────
const messageSchema = new Schema(
  {
    senderId:   { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: "User", required: true },
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
  },
  { timestamps: true }
);

// ─── Message Indexes ──────────────────────────────────────────────────────────

messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });

messageSchema.index({ receiverId: 1, senderId: 1, status: 1 });

export const Message = model("Message", messageSchema);



const conversationSchema = new Schema(
  {
    participantKey: {
      type: String,
      required: true,
      unique: true,        
    },

    participantIds: {
      type: [Schema.Types.ObjectId],
      required: true,
    },

    lastMessage:         { type: String,  default: "" },
    lastMessageType: {
      type: String,
      enum: ["text", "image", "file", "voice"],
      default: "text",
    },
    lastMessageSenderId: { type: Schema.Types.ObjectId, ref: "User" },
    lastMessageAt:       { type: Date,    default: Date.now },
    lastMessageStatus: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent",
    },


    unreadCounts: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// participantKey-এ unique index schema-তেই আছে।
// এই index conversation list query-এর জন্য।
conversationSchema.index({ participantIds: 1, lastMessageAt: -1 });

export const Conversation = model("Conversation", conversationSchema); 