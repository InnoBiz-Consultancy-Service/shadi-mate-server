"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionService = exports.PLAN_CONFIG = void 0;
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../../helpers/AppError"));
const subscription_model_1 = require("./subscription.model");
const user_model_1 = require("../user/user.model");
const envConfig_1 = require("../../../config/envConfig");
const axios_1 = __importDefault(require("axios"));
const epsHelper_1 = require("../../../utils/epsHelper");
// ─── Plan Config ──────────────────────────────────────────────────────────────
exports.PLAN_CONFIG = {
    "1month": {
        label: "1 Month",
        amount: 299, // BDT — পরিবর্তন করো
        months: 1, // কতো মাস যোগ হবে
    },
    "3month": {
        label: "3 Months",
        amount: 799, // BDT — পরিবর্তন করো
        months: 3,
    },
    "6month": {
        label: "6 Months",
        amount: 1499, // BDT — পরিবর্তন করো
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
const addMonths = (date, months) => {
    const startYear = date.getFullYear();
    const startMonth = date.getMonth(); // 0-indexed
    const startDay = date.getDate();
    // Target month calculate
    const totalMonths = startMonth + months;
    const targetYear = startYear + Math.floor(totalMonths / 12);
    const targetMonth = totalMonths % 12; // 0-indexed
    // Target month এ কতো দিন আছে
    const daysInTarget = new Date(targetYear, targetMonth + 1, 0).getDate();
    // Jan 31 → Feb তে 31 নেই → Feb 28 use করো
    const endDay = Math.min(startDay, daysInTarget);
    // endDate = same day next month, রাত ২৩:৫৯:৫৯:৯৯৯
    // Cron midnight ১২:০১ এ run হয় — তাই এই রাত ১২টার পরই expire হবে
    return new Date(targetYear, targetMonth, endDay, 23, 59, 59, 999);
};
// ─── Unique Transaction ID ────────────────────────────────────────────────────
const generateMerchantTransactionId = () => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    return `SM${timestamp}${random}`;
};
// ─── Initiate Payment ─────────────────────────────────────────────────────────
const initiatePayment = (userId, plan) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const user = yield user_model_1.User.findById(userId).lean();
    if (!user)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    // ─── Active subscription check ────────────────────────────────────────────
    const activeSubscription = yield subscription_model_1.Subscription.findOne({
        userId,
        status: "active",
        endDate: { $gt: new Date() },
    }).lean();
    if (activeSubscription) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.CONFLICT, `You have an active subscription that will expire on ${new Date(activeSubscription.endDate).toLocaleDateString("bn-BD")}.`);
    }
    const planConfig = exports.PLAN_CONFIG[plan];
    const merchantTransactionId = generateMerchantTransactionId();
    const customerOrderId = `ORD${Date.now()}`;
    const successUrl = `${envConfig_1.envVars.BACKEND_URL}/subscriptions/payment/success`;
    const failUrl = `${envConfig_1.envVars.BACKEND_URL}/subscriptions/payment/fail`;
    const cancelUrl = `${envConfig_1.envVars.BACKEND_URL}/subscriptions/payment/cancel`;
    // ─── Payment record (pending) ─────────────────────────────────────────────
    yield subscription_model_1.Payment.create({
        userId,
        plan,
        amount: planConfig.amount,
        merchantTransactionId,
        paymentStatus: "pending",
    });
    // ─── Step 1: EPS Token ────────────────────────────────────────────────────
    let token;
    try {
        token = yield (0, epsHelper_1.getEPSToken)();
    }
    catch (err) {
        yield subscription_model_1.Payment.findOneAndDelete({ merchantTransactionId });
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_GATEWAY, "Payment gateway authentication failed");
    }
    // ─── x-hash: merchantTransactionId দিয়ে ──────────────────────────────────
    const xHash = (0, epsHelper_1.generateEPSHash)(merchantTransactionId);
    // ─── Step 2: InitializeEPS ────────────────────────────────────────────────
    const epsBody = {
        storeId: envConfig_1.envVars.EPS_STORE_ID,
        merchantId: envConfig_1.envVars.EPS_MERCHANT_ID,
        CustomerOrderId: customerOrderId,
        merchantTransactionId,
        transactionTypeId: 1, // 1 = Web
        financialEntityId: 0,
        transitionStatusId: 0,
        totalAmount: planConfig.amount,
        ipAddress: "0.0.0.0",
        version: "1",
        successUrl,
        failUrl,
        cancelUrl,
        customerName: user.name,
        customerEmail: user.email,
        CustomerAddress: "Bangladesh",
        CustomerCity: "Dhaka",
        CustomerState: "Dhaka",
        CustomerPostcode: "1230",
        CustomerCountry: "BD",
        CustomerPhone: user.phone,
        ShippingMethod: "NO",
        NoOfItem: "1",
        ProductName: `ShadiMate ${planConfig.label} Premium Subscription`,
        ProductProfile: "non-physical-goods",
        ProductCategory: "Subscription",
        ProductList: [
            {
                ProductName: `ShadiMate ${planConfig.label} Premium Subscription`,
                NoOfItem: "1",
                ProductProfile: "non-physical-goods",
                ProductCategory: "Subscription",
                ProductPrice: planConfig.amount.toString(),
            },
        ],
    };
    let epsResponse;
    try {
        const response = yield axios_1.default.post(epsHelper_1.EPS_URLS.INITIALIZE, epsBody, {
            headers: {
                "Content-Type": "application/json",
                "x-hash": xHash,
                "Authorization": `Bearer ${token}`,
            },
        });
        epsResponse = response.data;
    }
    catch (err) {
        console.error("❌ EPS InitializeEPS error:", (_b = (_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : err.message);
        yield subscription_model_1.Payment.findOneAndUpdate({ merchantTransactionId }, { paymentStatus: "failed" });
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_GATEWAY, "Payment gateway error. Please try again.");
    }
    if (!(epsResponse === null || epsResponse === void 0 ? void 0 : epsResponse.RedirectURL)) {
        yield subscription_model_1.Payment.findOneAndUpdate({ merchantTransactionId }, { paymentStatus: "failed" });
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_GATEWAY, "EPS থেকে payment URL পাওয়া যায়নি");
    }
    console.log(`💳 Payment initialized: ${merchantTransactionId} | Plan: ${plan} | Amount: ${planConfig.amount} BDT`);
    return {
        merchantTransactionId,
        paymentUrl: epsResponse.RedirectURL,
        plan,
        planLabel: planConfig.label,
        amount: planConfig.amount,
    };
});
// ─── Verify Transaction (API No. 03) ─────────────────────────────────────────
const verifyTransaction = (merchantTransactionId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const token = yield (0, epsHelper_1.getEPSToken)();
        const xHash = (0, epsHelper_1.generateEPSHash)(merchantTransactionId);
        const response = yield axios_1.default.get(epsHelper_1.EPS_URLS.VERIFY, {
            params: { merchantTransactionId },
            headers: {
                "x-hash": xHash,
                "Authorization": `Bearer ${token}`,
            },
        });
        return response.data;
    }
    catch (err) {
        console.error("❌ EPS verify error:", (_b = (_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : err.message);
        return null;
    }
});
// ─── Payment Success Callback ─────────────────────────────────────────────────
const handlePaymentSuccess = (callbackData) => __awaiter(void 0, void 0, void 0, function* () {
    const merchantTransactionId = callbackData.merchantTransactionId ||
        callbackData.MerchantTransactionId;
    if (!merchantTransactionId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Transaction ID missing");
    }
    const payment = yield subscription_model_1.Payment.findOne({ merchantTransactionId });
    if (!payment)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Payment record not found");
    // Duplicate prevent
    if (payment.paymentStatus === "success") {
        console.log(`⚠️ Duplicate callback: ${merchantTransactionId}`);
        return { alreadyProcessed: true };
    }
    // ─── Verify করো ──────────────────────────────────────────────────────────
    const verifyResult = yield verifyTransaction(merchantTransactionId);
    if (!verifyResult || verifyResult.Status !== "Success") {
        yield subscription_model_1.Payment.findByIdAndUpdate(payment._id, { paymentStatus: "failed" });
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Transaction verification failed");
    }
    // ─── Correct month-based end date calculate করো ───────────────────────────
    // JavaScript এর addMonths function use করো
    // এটা calendar month অনুযায়ী কাজ করে:
    //   Jan 15 + 1 month = Feb 15  ✅
    //   Jan 31 + 1 month = Feb 28  ✅ (not March 2)
    //   Mar 31 + 3 month = Jun 30  ✅ (not July 1)
    //   Aug 31 + 6 month = Feb 28  ✅ (not March 2)
    const planConfig = exports.PLAN_CONFIG[payment.plan];
    const startDate = new Date();
    const endDate = addMonths(startDate, planConfig.months);
    console.log(`📅 Subscription: ${startDate.toLocaleDateString()} → ${endDate.toLocaleDateString()} (${planConfig.months} month${planConfig.months > 1 ? "s" : ""})`);
    // ─── Subscription create ──────────────────────────────────────────────────
    const subscription = yield subscription_model_1.Subscription.create({
        userId: payment.userId,
        plan: payment.plan,
        amount: payment.amount,
        startDate,
        endDate,
        status: "active",
    });
    // ─── Payment update ───────────────────────────────────────────────────────
    yield subscription_model_1.Payment.findByIdAndUpdate(payment._id, {
        paymentStatus: "success",
        epsTransactionId: verifyResult.MerchantTransactionId,
        subscriptionId: subscription._id,
        paidAt: new Date(),
    });
    // ─── User premium করো ────────────────────────────────────────────────────
    yield user_model_1.User.findByIdAndUpdate(payment.userId, { subscription: "premium" });
    console.log(`✅ Premium activated: user ${payment.userId} | ${payment.plan} | Until: ${endDate.toLocaleDateString("bn-BD")}`);
    return { success: true, subscription };
});
// ─── Payment Fail ─────────────────────────────────────────────────────────────
const handlePaymentFail = (callbackData) => __awaiter(void 0, void 0, void 0, function* () {
    const id = callbackData.merchantTransactionId || callbackData.MerchantTransactionId;
    if (id) {
        yield subscription_model_1.Payment.findOneAndUpdate({ merchantTransactionId: id, paymentStatus: "pending" }, { paymentStatus: "failed" });
    }
    console.log(`❌ Payment failed: ${id}`);
    return { success: false };
});
// ─── Payment Cancel ───────────────────────────────────────────────────────────
const handlePaymentCancel = (callbackData) => __awaiter(void 0, void 0, void 0, function* () {
    const id = callbackData.merchantTransactionId || callbackData.MerchantTransactionId;
    if (id) {
        yield subscription_model_1.Payment.findOneAndUpdate({ merchantTransactionId: id, paymentStatus: "pending" }, { paymentStatus: "cancelled" });
    }
    console.log(`🚫 Payment cancelled: ${id}`);
    return { success: false };
});
// ─── Get My Subscription ──────────────────────────────────────────────────────
const getMySubscription = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    return (_a = yield subscription_model_1.Subscription.findOne({
        userId,
        status: "active",
        endDate: { $gt: new Date() },
    }).lean()) !== null && _a !== void 0 ? _a : null;
});
// ─── Get Payment History ──────────────────────────────────────────────────────
const getMyPaymentHistory = (userId_1, ...args_1) => __awaiter(void 0, [userId_1, ...args_1], void 0, function* (userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [payments, total] = yield Promise.all([
        subscription_model_1.Payment.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        subscription_model_1.Payment.countDocuments({ userId }),
    ]);
    return { payments, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
});
// ─── Expire Subscriptions (Cron Job) ─────────────────────────────────────────
const expireSubscriptions = () => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    const expiredList = yield subscription_model_1.Subscription.find({
        status: "active",
        endDate: { $lte: now },
    }).lean();
    if (!expiredList.length) {
        console.log("✅ No subscriptions to expire");
        return;
    }
    yield subscription_model_1.Subscription.updateMany({ _id: { $in: expiredList.map((s) => s._id) } }, { status: "expired" });
    yield user_model_1.User.updateMany({ _id: { $in: expiredList.map((s) => s.userId) } }, { subscription: "free" });
    console.log(`🔄 ${expiredList.length} subscription(s) expired — users downgraded to free`);
});
exports.SubscriptionService = {
    initiatePayment,
    handlePaymentSuccess,
    handlePaymentFail,
    handlePaymentCancel,
    verifyTransaction,
    getMySubscription,
    getMyPaymentHistory,
    expireSubscriptions,
};
