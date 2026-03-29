import { Document, Types } from "mongoose";

export type TNotificationType = "new_message" | "like" | "profile_visit";

export interface INotification extends Document {
    _id: Types.ObjectId;
    recipientId: Types.ObjectId;
    senderId: Types.ObjectId;
    type: TNotificationType;
    message: string;
    isRead: boolean;
    metadata: {
        messageId?: string;
        conversationWith?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}