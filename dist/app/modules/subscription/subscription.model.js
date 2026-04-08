"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payment = exports.Subscription = void 0;
const mongoose_1 = require("mongoose");
// ─── Subscription Schema ──────────────────────────────────────────────────────
const subscriptionSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, { timestamps: true });
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ endDate: 1, status: 1 });
exports.Subscription = (0, mongoose_1.model)("Subscription", subscriptionSchema);
// ─── Payment Schema ───────────────────────────────────────────────────────────
const paymentSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    subscriptionId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, { timestamps: true });
paymentSchema.index({ merchantTransactionId: 1 });
paymentSchema.index({ userId: 1, createdAt: -1 });
exports.Payment = (0, mongoose_1.model)("Payment", paymentSchema);
