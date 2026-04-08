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
exports.SubscriptionController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = require("../../../utils/catchAsync");
const sendResponse_1 = require("../../../utils/sendResponse");
const subscription_service_1 = require("./subscription.service");
const envConfig_1 = require("../../../config/envConfig");
const AppError_1 = __importDefault(require("../../../helpers/AppError"));
// ─── Get Plans ────────────────────────────────────────────────────────────────
const getPlans = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const plans = Object.entries(subscription_service_1.PLAN_CONFIG).map(([key, value]) => ({
        plan: key,
        label: value.label,
        amount: value.amount,
        months: value.months,
        currency: "BDT",
    }));
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Subscription plans fetched",
        data: plans,
    });
}));
// ─── Initiate Payment ─────────────────────────────────────────────────────────
const initiatePayment = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { plan } = req.body;
    if (!plan || !["1month", "3month", "6month"].includes(plan)) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid plan. Choose: 1month, 3month, or 6month");
    }
    const result = yield subscription_service_1.SubscriptionService.initiatePayment(userId, plan);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Payment initiated. Redirect user to paymentUrl.",
        data: result,
    });
}));
// ─── Payment Success Callback ─────────────────────────────────────────────────
const paymentSuccess = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const callbackData = Object.assign(Object.assign({}, req.body), req.query);
    console.log("✅ EPS Success Callback Hit:", callbackData);
    // 🔥 IMPORTANT: normalize keys (EPS case mismatch fix)
    const normalizedData = {
        merchantTransactionId: callbackData.merchantTransactionId ||
            callbackData.MerchantTransactionId,
        status: callbackData.Status ||
            callbackData.status,
        epsTransactionId: callbackData.EPSTransactionId ||
            callbackData.epsTransactionId,
    };
    if (!normalizedData.merchantTransactionId) {
        console.error("❌ Missing MerchantTransactionId");
        return res.redirect(`${envConfig_1.envVars.FRONTEND_URL}/payment/fail`);
    }
    try {
        const result = yield subscription_service_1.SubscriptionService.handlePaymentSuccess(normalizedData);
        // 🔁 Duplicate callback safe
        if (result === null || result === void 0 ? void 0 : result.alreadyProcessed) {
            return res.redirect(`${envConfig_1.envVars.FRONTEND_URL}/payment/success?status=already_processed`);
        }
        // ✅ SUCCESS redirect
        return res.redirect(`${envConfig_1.envVars.FRONTEND_URL}/payment/success?tran_id=${normalizedData.merchantTransactionId}`);
    }
    catch (err) {
        console.error("❌ Payment success callback error:", err);
        return res.redirect(`${envConfig_1.envVars.FRONTEND_URL}/payment/fail?tran_id=${normalizedData.merchantTransactionId}`);
    }
}));
// ─── Payment Fail Callback ────────────────────────────────────────────────────
const paymentFail = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const callbackData = Object.assign(Object.assign({}, req.body), req.query);
    yield subscription_service_1.SubscriptionService.handlePaymentFail(callbackData);
    res.redirect(`${envConfig_1.envVars.FRONTEND_URL}/payment/fail`);
}));
// ─── Payment Cancel Callback ──────────────────────────────────────────────────
const paymentCancel = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const callbackData = Object.assign(Object.assign({}, req.body), req.query);
    yield subscription_service_1.SubscriptionService.handlePaymentCancel(callbackData);
    res.redirect(`${envConfig_1.envVars.FRONTEND_URL}/payment/cancel`);
}));
// ─── Get My Subscription ──────────────────────────────────────────────────────
const getMySubscription = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const result = yield subscription_service_1.SubscriptionService.getMySubscription(userId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: result ? "Active subscription fetched" : "No active subscription",
        data: result,
    });
}));
// ─── Get Payment History ──────────────────────────────────────────────────────
const getMyPaymentHistory = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = yield subscription_service_1.SubscriptionService.getMyPaymentHistory(userId, page, limit);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Payment history fetched",
        data: result.payments,
        meta: result.meta,
    });
}));
exports.SubscriptionController = {
    getPlans,
    initiatePayment,
    paymentSuccess,
    paymentFail,
    paymentCancel,
    getMySubscription,
    getMyPaymentHistory,
};
