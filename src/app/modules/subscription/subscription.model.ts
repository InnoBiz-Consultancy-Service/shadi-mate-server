import { Schema, model } from "mongoose";
import { IPayment, ISubscription } from "./subscription.inteface";

// ─── Subscription Schema ──────────────────────────────────────────────────────
const subscriptionSchema = new Schema<ISubscription>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        plan: {
            type: String,
            enum: ["1month", "3month", "6month"],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ["active", "expired", "cancelled"],
            default: "active",
        },
    },
    { timestamps: true }
);

subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ endDate: 1, status: 1 });

export const Subscription = model<ISubscription>("Subscription", subscriptionSchema);

// ─── Payment Schema ───────────────────────────────────────────────────────────
const paymentSchema = new Schema<IPayment>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        subscriptionId: {
            type: Schema.Types.ObjectId,
            ref: "Subscription",
        },
        plan: {
            type: String,
            enum: ["1month", "3month", "6month"],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        merchantTransactionId: {
            type: String,
            required: true,
            unique: true,
        },
        epsTransactionId: {
            type: String,
        },
        paymentStatus: {
            type: String,
            enum: ["pending", "success", "failed", "cancelled"],
            default: "pending",
        },
        paidAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

paymentSchema.index({ merchantTransactionId: 1 });
paymentSchema.index({ userId: 1, createdAt: -1 });

export const Payment = model<IPayment>("Payment", paymentSchema);