import { Schema, model } from "mongoose";
import { IEmailCampaign } from "./email.interface";

const emailCampaignSchema = new Schema<IEmailCampaign>(
    {
        subject: {
            type: String,
            required: true,
            trim: true,
        },
        body: {
            type: String,
            required: true,
        },
        recipientType: {
            type: String,
            enum: ["all", "free", "premium", "selected"],
            required: true,
        },
        selectedUserIds: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        totalRecipients: {
            type: Number,
            default: 0,
        },
        sentCount: {
            type: Number,
            default: 0,
        },
        failedCount: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ["pending", "sending", "sent", "failed"],
            default: "pending",
        },
        sentBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        startedAt: {
            type: Date,
        },
        completedAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

emailCampaignSchema.index({ status: 1, createdAt: -1 });
emailCampaignSchema.index({ sentBy: 1 });

export const EmailCampaign = model<IEmailCampaign>("EmailCampaign", emailCampaignSchema);


const emailLogSchema = new Schema(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: "EmailCampaign",
      required: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    email: String,
    name: String,

    status: {
      type: String,
      enum: ["sent", "failed"],
      required: true,
    },

    error: String,
  },
  { timestamps: true }
);

emailLogSchema.index({ campaignId: 1 });
emailLogSchema.index({ userId: 1 });

export const EmailLog = model("EmailLog", emailLogSchema);