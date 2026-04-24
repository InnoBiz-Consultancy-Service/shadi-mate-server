import { StatusCodes } from "http-status-codes";
import AppError from "../../../helpers/AppError";
import { Subscription, Payment } from "./subscription.model";
import { User } from "../user/user.model";
import { envVars } from "../../../config/envConfig";
import axios from "axios";
import { EPS_URLS, generateEPSHash, getEPSToken } from "../../../utils/epsHelper";
import { invalidateUserCache } from "../user/user.cache";
import mongoose from "mongoose";

// ─── Plan Config ──────────────────────────────────────────────────────────────
export const PLAN_CONFIG = {
    "1month": {
        label: "1 Month",
        amount: 299,
        months: 1,
    },
    "3month": {
        label: "3 Months",
        amount: 799,
        months: 3,
    },
    "6month": {
        label: "6 Months",
        amount: 1499,
        months: 6,
    },
};

// ─── Correct Month-Based End Date Calculate ───────────────────────────────────
const addMonths = (date: Date, months: number): Date => {
    const startYear  = date.getFullYear();
    const startMonth = date.getMonth();
    const startDay   = date.getDate();

    const totalMonths     = startMonth + months;
    const targetYear      = startYear + Math.floor(totalMonths / 12);
    const targetMonth     = totalMonths % 12;

    const daysInTarget = new Date(targetYear, targetMonth + 1, 0).getDate();
    const endDay = Math.min(startDay, daysInTarget);

    return new Date(targetYear, targetMonth, endDay, 23, 59, 59, 999);
};

// ─── Unique Transaction ID ────────────────────────────────────────────────────
const generateMerchantTransactionId = (): string => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    return `SM${timestamp}${random}`;
};

// ─── Get correct backend base URL ─────────────────────────────────────────────
// BACKEND_URL in env should be like: https://shadi-mate-server.onrender.com/api/v1
// The callback routes are registered under /api/v1/subscriptions/payment/...
const getBackendUrl = (): string => {
    const url = envVars.BACKEND_URL;
    // Remove trailing slash if present
    return url.replace(/\/$/, "");
};

// ─── Initiate Payment ─────────────────────────────────────────────────────────
const initiatePayment = async (
    userId: string,
    plan: "1month" | "3month" | "6month"
) => {
    const user = await User.findById(userId).lean();
    if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found");

    const activeSubscription = await Subscription.findOne({
        userId,
        status: "active",
        endDate: { $gt: new Date() },
    }).lean();

    if (activeSubscription) {
        throw new AppError(
            StatusCodes.CONFLICT,
            `You have an active subscription that will expire on ${new Date(activeSubscription.endDate).toLocaleDateString("en-BD")}.`
        );
    }

    const planConfig = PLAN_CONFIG[plan];
    const merchantTransactionId = generateMerchantTransactionId();
    const customerOrderId = `ORD${Date.now()}`;

    const backendBase = getBackendUrl();

    // These must exactly match what EPS will call back
    const successUrl = `${backendBase}/subscriptions/payment/success`;
    const failUrl    = `${backendBase}/subscriptions/payment/fail`;
    const cancelUrl  = `${backendBase}/subscriptions/payment/cancel`;

    console.log("💳 Payment callback URLs:", { successUrl, failUrl, cancelUrl });

    await Payment.create({
        userId,
        plan,
        amount: planConfig.amount,
        merchantTransactionId,
        paymentStatus: "pending",
    });

    let token: string;
    try {
        token = await getEPSToken();
    } catch (err) {
        await Payment.findOneAndDelete({ merchantTransactionId });
        throw new AppError(StatusCodes.BAD_GATEWAY, "Payment gateway authentication failed");
    }

    const xHash = generateEPSHash(merchantTransactionId);

    const epsBody = {
        storeId:              envVars.EPS_STORE_ID,
        merchantId:           envVars.EPS_MERCHANT_ID,
        CustomerOrderId:      customerOrderId,
        merchantTransactionId,
        transactionTypeId:    1,
        financialEntityId:    0,
        transitionStatusId:   0,
        totalAmount:          planConfig.amount,
        ipAddress:            "0.0.0.0",
        version:              "1",
        successUrl,
        failUrl,
        cancelUrl,
        customerName:         user.name,
        customerEmail:        user.email,
        CustomerAddress:      "Bangladesh",
        CustomerCity:         "Dhaka",
        CustomerState:        "Dhaka",
        CustomerPostcode:     "1230",
        CustomerCountry:      "BD",
        CustomerPhone:        user.phone,
        ShippingMethod:       "NO",
        NoOfItem:             "1",
        ProductName:          `ShadiMate ${planConfig.label} Premium Subscription`,
        ProductProfile:       "non-physical-goods",
        ProductCategory:      "Subscription",
        ProductList: [
            {
                ProductName:     `ShadiMate ${planConfig.label} Premium Subscription`,
                NoOfItem:        "1",
                ProductProfile:  "non-physical-goods",
                ProductCategory: "Subscription",
                ProductPrice:    planConfig.amount.toString(),
            },
        ],
    };

    let epsResponse: any;
    try {
        const response = await axios.post(EPS_URLS.INITIALIZE, epsBody, {
            headers: {
                "Content-Type":  "application/json",
                "x-hash":        xHash,
                "Authorization": `Bearer ${token}`,
            },
        });
        epsResponse = response.data;
        console.log("✅ EPS Initialize response:", JSON.stringify(epsResponse));
    } catch (err: any) {
        console.error("❌ EPS InitializeEPS error:", err?.response?.data ?? err.message);
        await Payment.findOneAndUpdate(
            { merchantTransactionId },
            { paymentStatus: "failed" }
        );
        throw new AppError(StatusCodes.BAD_GATEWAY, "Payment gateway error. Please try again.");
    }

    if (!epsResponse?.RedirectURL) {
        await Payment.findOneAndUpdate(
            { merchantTransactionId },
            { paymentStatus: "failed" }
        );
        throw new AppError(StatusCodes.BAD_GATEWAY, "Could not get payment URL from EPS");
    }

    console.log(`💳 Payment initialized: ${merchantTransactionId} | Plan: ${plan} | Amount: ${planConfig.amount} BDT`);

    return {
        merchantTransactionId,
        paymentUrl: epsResponse.RedirectURL,
        plan,
        planLabel: planConfig.label,
        amount: planConfig.amount,
    };
};

// ─── Verify Transaction ───────────────────────────────────────────────────────
const verifyTransaction = async (merchantTransactionId: string) => {
    try {
        const token = await getEPSToken();
        const xHash = generateEPSHash(merchantTransactionId);

        const response = await axios.get(EPS_URLS.VERIFY, {
            params: { merchantTransactionId },
            headers: {
                "x-hash":        xHash,
                "Authorization": `Bearer ${token}`,
            },
        });

        console.log("✅ EPS Verify response:", JSON.stringify(response.data));
        return response.data;
    } catch (err: any) {
        console.error("❌ EPS verify error:", err?.response?.data ?? err.message);
        return null;
    }
};

// ─── Payment Success Callback ─────────────────────────────────────────────────
const handlePaymentSuccess = async (callbackData: {
    merchantTransactionId: string;
    status: string;
    epsTransactionId?: string;
}) => {
    const { merchantTransactionId, status, epsTransactionId } = callbackData;

    console.log("🔄 handlePaymentSuccess called:", { merchantTransactionId, status, epsTransactionId });

    if (!merchantTransactionId) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Transaction ID missing");
    }

    const payment = await Payment.findOne({ merchantTransactionId });
    if (!payment) {
        console.error("❌ Payment not found for:", merchantTransactionId);
        throw new AppError(StatusCodes.NOT_FOUND, "Payment record not found");
    }

    // ─── Duplicate callback guard ─────────────────────────────────────────────
    if (payment.paymentStatus === "success") {
        console.log(`⚠️ Duplicate callback: ${merchantTransactionId}`);
        return { alreadyProcessed: true };
    }

    // ─── EPS verify ───────────────────────────────────────────────────────────
    const verifyResult = await verifyTransaction(merchantTransactionId);

    // Accept if either:
    // 1. EPS verify returns Status === "Success"
    // 2. The original callback status was "Success" AND verify returned something (sandbox may differ)
    const isVerified =
        verifyResult?.Status === "Success" ||
        verifyResult?.status === "Success" ||
        (status === "Success" && verifyResult !== null);

    if (!isVerified) {
        console.error("❌ Transaction verification failed. verifyResult:", verifyResult);
        await Payment.findByIdAndUpdate(payment._id, { paymentStatus: "failed" });
        throw new AppError(StatusCodes.BAD_REQUEST, "Transaction verification failed");
    }

    const planConfig = PLAN_CONFIG[payment.plan as keyof typeof PLAN_CONFIG];
    const startDate = new Date();
    const endDate = addMonths(startDate, planConfig.months);

    console.log(`📅 Subscription: ${startDate.toLocaleDateString()} → ${endDate.toLocaleDateString()} (${planConfig.months} month${planConfig.months > 1 ? "s" : ""})`);

    const session = await mongoose.startSession();

    let subscription: any;

    try {
        await session.withTransaction(async () => {
            const [createdSub] = await Subscription.create(
                [
                    {
                        userId:    payment.userId,
                        plan:      payment.plan,
                        amount:    payment.amount,
                        startDate,
                        endDate,
                        status:    "active",
                    },
                ],
                { session }
            );
            subscription = createdSub;

            await Payment.findByIdAndUpdate(
                payment._id,
                {
                    paymentStatus:    "success",
                    epsTransactionId: epsTransactionId || verifyResult?.MerchantTransactionId || "",
                    subscriptionId:   createdSub._id,
                    paidAt:           new Date(),
                },
                { session }
            );

            await User.findByIdAndUpdate(
                payment.userId,
                { subscription: "premium" },
                { session }
            );
        });
    } finally {
        await session.endSession();
    }

    const userId = String(payment.userId);
    await invalidateUserCache(userId);

    console.log(`✅ Premium activated: user ${userId} | ${payment.plan} | Until: ${endDate.toLocaleDateString("en-BD")}`);

    return { success: true, subscription };
};

// ─── Payment Fail ─────────────────────────────────────────────────────────────
const handlePaymentFail = async (callbackData: Record<string, string>) => {
    const id = callbackData.merchantTransactionId ||
               callbackData.MerchantTransactionId ||
               callbackData["MerchantTransactionId "] || "";
    if (id) {
        await Payment.findOneAndUpdate(
            { merchantTransactionId: id, paymentStatus: "pending" },
            { paymentStatus: "failed" }
        );
    }
    console.log(`❌ Payment failed: ${id}`);
    return { success: false };
};

// ─── Payment Cancel ───────────────────────────────────────────────────────────
const handlePaymentCancel = async (callbackData: Record<string, string>) => {
    const id = callbackData.merchantTransactionId ||
               callbackData.MerchantTransactionId ||
               callbackData["MerchantTransactionId "] || "";
    if (id) {
        await Payment.findOneAndUpdate(
            { merchantTransactionId: id, paymentStatus: "pending" },
            { paymentStatus: "cancelled" }
        );
    }
    console.log(`🚫 Payment cancelled: ${id}`);
    return { success: false };
};

// ─── Get My Subscription ──────────────────────────────────────────────────────
const getMySubscription = async (userId: string) => {
    return await Subscription.findOne({
        userId,
        status: "active",
        endDate: { $gt: new Date() },
    }).lean() ?? null;
};

// ─── Get Payment History ──────────────────────────────────────────────────────
const getMyPaymentHistory = async (userId: string, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
        Payment.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Payment.countDocuments({ userId }),
    ]);
    return { payments, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

// ─── Expire Subscriptions (Cron Job) ─────────────────────────────────────────
const expireSubscriptions = async () => {
    const now = new Date();

    const expiredList = await Subscription.find({
        status: "active",
        endDate: { $lte: now },
    }).lean();

    if (!expiredList.length) {
        console.log("✅ No subscriptions to expire");
        return;
    }

    await Subscription.updateMany(
        { _id: { $in: expiredList.map((s) => s._id) } },
        { status: "expired" }
    );

    await User.updateMany(
        { _id: { $in: expiredList.map((s) => s.userId) } },
        { subscription: "free" }
    );

    await Promise.all(
        expiredList.map((s) => invalidateUserCache(String(s.userId)))
    );

    console.log(`🔄 ${expiredList.length} subscription(s) expired`);
};

export const SubscriptionService = {
    initiatePayment,
    handlePaymentSuccess,
    handlePaymentFail,
    handlePaymentCancel,
    verifyTransaction,
    getMySubscription,
    getMyPaymentHistory,
    expireSubscriptions,
};