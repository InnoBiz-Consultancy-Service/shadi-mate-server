import { Document, Types } from "mongoose";

export type TSubscriptionPlan = "monthly" | "quarterly" | "yearly";
export type TSubscriptionStatus = "active" | "expired" | "cancelled";
export type TPaymentStatus = "pending" | "success" | "failed" | "cancelled";

export interface ISubscription extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    plan: TSubscriptionPlan;
    amount: number;
    startDate: Date;
    endDate: Date;
    status: TSubscriptionStatus;
    createdAt: Date;
    updatedAt: Date;
}

export interface IPayment extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    subscriptionId?: Types.ObjectId;
    plan: TSubscriptionPlan;
    amount: number;
    merchantTransactionId: string;
    epsTransactionId?: string;
    paymentStatus: TPaymentStatus;
    paidAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}