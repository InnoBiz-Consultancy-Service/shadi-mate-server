import { StatusCodes } from "http-status-codes";
import AppError from "../../../helpers/AppError";
import { Subscription, Payment } from "./subscription.model";
import { User } from "../user/user.model";
import { envVars } from "../../../config/envConfig";
import axios from "axios";
import { EPS_URLS, generateEPSHash, getEPSToken } from "../../../utils/epsHelper";

// ─── Plan Config ──────────────────────────────────────────────────────────────
export const PLAN_CONFIG = {
    "1month": {
        label: "1 Month",
        amount: 299,      // BDT — পরিবর্তন করো
        months: 1,        // কতো মাস যোগ হবে
    },
    "3month": {
        label: "3 Months",
        amount: 799,      // BDT — পরিবর্তন করো
        months: 3,
    },
    "6month": {
        label: "6 Months",
        amount: 1499,     // BDT — পরিবর্তন করো
        months: 6,
    },
};

// ─── Correct Month-Based End Date Calculate ───────────────────────────────────
// Requirement:
//   April 6 subscribe → May 6 রাত ১২টার পর expire
//   endDate = May 6 23:59:59
//   Cron রাত ১২:০১ তে run করলে May 7 তে expire mark হবে ✅
//
// Edge cases:
//   Jan 31 + 1 month → Feb 28 23:59:59  (not March 2)
//   Mar 31 + 3 months → Jun 30 23:59:59 (not July 1)
//   Aug 31 + 6 months → Feb 28 23:59:59 (not March 2)
const addMonths = (date: Date, months: number): Date => {
    const startYear  = date.getFullYear();
    const startMonth = date.getMonth();  // 0-indexed
    const startDay   = date.getDate();

    // Target month calculate
    const totalMonths     = startMonth + months;
    const targetYear      = startYear + Math.floor(totalMonths / 12);
    const targetMonth     = totalMonths % 12;  // 0-indexed

    // Target month এ কতো দিন আছে
    const daysInTarget = new Date(targetYear, targetMonth + 1, 0).getDate();

    // Jan 31 → Feb তে 31 নেই → Feb 28 use করো
    const endDay = Math.min(startDay, daysInTarget);

    // endDate = same day next month, রাত ২৩:৫৯:৫৯:৯৯৯
    // Cron midnight ১২:০১ এ run হয় — তাই এই রাত ১২টার পরই expire হবে
    return new Date(targetYear, targetMonth, endDay, 23, 59, 59, 999);
};

// ─── Unique Transaction ID ────────────────────────────────────────────────────
const generateMerchantTransactionId = (): string => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    return `SM${timestamp}${random}`;
};

// ─── Initiate Payment ─────────────────────────────────────────────────────────
const initiatePayment = async (
    userId: string,
    plan: "1month" | "3month" | "6month"
) => {
    const user = await User.findById(userId).lean();
    if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found");

    // ─── Active subscription check ────────────────────────────────────────────
    const activeSubscription = await Subscription.findOne({
        userId,
        status: "active",
        endDate: { $gt: new Date() },
    }).lean();

    if (activeSubscription) {
        throw new AppError(
            StatusCodes.CONFLICT,
            `You have an active subscription that will expire on ${new Date(activeSubscription.endDate).toLocaleDateString("bn-BD")}.`
        );
    }

    const planConfig = PLAN_CONFIG[plan];
    const merchantTransactionId = generateMerchantTransactionId();
    const customerOrderId = `ORD${Date.now()}`;

    const successUrl = `${envVars.BACKEND_URL}/subscriptions/payment/success`;
    const failUrl    = `${envVars.BACKEND_URL}/subscriptions/payment/fail`;
    const cancelUrl  = `${envVars.BACKEND_URL}/subscriptions/payment/cancel`;

    // ─── Payment record (pending) ─────────────────────────────────────────────
    await Payment.create({
        userId,
        plan,
        amount: planConfig.amount,
        merchantTransactionId,
        paymentStatus: "pending",
    });

    // ─── Step 1: EPS Token ────────────────────────────────────────────────────
    let token: string;
    try {
        token = await getEPSToken();
    } catch (err) {
        await Payment.findOneAndDelete({ merchantTransactionId });
        throw new AppError(StatusCodes.BAD_GATEWAY, "Payment gateway authentication failed");
    }

    // ─── x-hash: merchantTransactionId দিয়ে ──────────────────────────────────
    const xHash = generateEPSHash(merchantTransactionId);

    // ─── Step 2: InitializeEPS ────────────────────────────────────────────────
    const epsBody = {
        storeId:              envVars.EPS_STORE_ID,
        merchantId:           envVars.EPS_MERCHANT_ID,
        CustomerOrderId:      customerOrderId,
        merchantTransactionId,
        transactionTypeId:    1,        // 1 = Web
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
        throw new AppError(StatusCodes.BAD_GATEWAY, "EPS থেকে payment URL পাওয়া যায়নি");
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

// ─── Verify Transaction (API No. 03) ─────────────────────────────────────────
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

        return response.data;
    } catch (err: any) {
        console.error("❌ EPS verify error:", err?.response?.data ?? err.message);
        return null;
    }
};

// ─── Payment Success Callback ─────────────────────────────────────────────────
const handlePaymentSuccess = async (callbackData: any) => {
    const merchantTransactionId =
        callbackData.merchantTransactionId ||
        callbackData.MerchantTransactionId;

    if (!merchantTransactionId) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Transaction ID missing");
    }

    const payment = await Payment.findOne({ merchantTransactionId });
    if (!payment) throw new AppError(StatusCodes.NOT_FOUND, "Payment record not found");

    // Duplicate prevent
    if (payment.paymentStatus === "success") {
        console.log(`⚠️ Duplicate callback: ${merchantTransactionId}`);
        return { alreadyProcessed: true };
    }

    // ─── Verify করো ──────────────────────────────────────────────────────────
    const verifyResult = await verifyTransaction(merchantTransactionId);

    if (!verifyResult || verifyResult.Status !== "Success") {
        await Payment.findByIdAndUpdate(payment._id, { paymentStatus: "failed" });
        throw new AppError(StatusCodes.BAD_REQUEST, "Transaction verification failed");
    }

    // ─── Correct month-based end date calculate করো ───────────────────────────
    // JavaScript এর addMonths function use করো
    // এটা calendar month অনুযায়ী কাজ করে:
    //   Jan 15 + 1 month = Feb 15  ✅
    //   Jan 31 + 1 month = Feb 28  ✅ (not March 2)
    //   Mar 31 + 3 month = Jun 30  ✅ (not July 1)
    //   Aug 31 + 6 month = Feb 28  ✅ (not March 2)
    const planConfig = PLAN_CONFIG[payment.plan as keyof typeof PLAN_CONFIG];
    const startDate = new Date();
    const endDate = addMonths(startDate, planConfig.months);

    console.log(`📅 Subscription: ${startDate.toLocaleDateString()} → ${endDate.toLocaleDateString()} (${planConfig.months} month${planConfig.months > 1 ? "s" : ""})`);

    // ─── Subscription create ──────────────────────────────────────────────────
    const subscription = await Subscription.create({
        userId:    payment.userId,
        plan:      payment.plan,
        amount:    payment.amount,
        startDate,
        endDate,
        status:    "active",
    });

    // ─── Payment update ───────────────────────────────────────────────────────
    await Payment.findByIdAndUpdate(payment._id, {
        paymentStatus:    "success",
        epsTransactionId: verifyResult.MerchantTransactionId,
        subscriptionId:   subscription._id,
        paidAt:           new Date(),
    });

    // ─── User premium করো ────────────────────────────────────────────────────
    await User.findByIdAndUpdate(payment.userId, { subscription: "premium" });

    console.log(`✅ Premium activated: user ${payment.userId} | ${payment.plan} | Until: ${endDate.toLocaleDateString("bn-BD")}`);

    return { success: true, subscription };
};

// ─── Payment Fail ─────────────────────────────────────────────────────────────
const handlePaymentFail = async (callbackData: any) => {
    const id = callbackData.merchantTransactionId || callbackData.MerchantTransactionId;
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
const handlePaymentCancel = async (callbackData: any) => {
    const id = callbackData.merchantTransactionId || callbackData.MerchantTransactionId;
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

    console.log(`🔄 ${expiredList.length} subscription(s) expired — users downgraded to free`);
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