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
const currency_1 = require("../../../utils/currency");
// ─── Real IP বের করা ──────────────────────────────────────────────────────────
const getClientIP = (req) => {
    var _a;
    const forwarded = req.headers["x-forwarded-for"];
    if (forwarded) {
        return (typeof forwarded === "string" ? forwarded : forwarded[0]).split(",")[0].trim();
    }
    return ((_a = req.socket) === null || _a === void 0 ? void 0 : _a.remoteAddress) || req.ip || "127.0.0.1";
};
// ─── GET /api/v1/subscriptions/plans ─────────────────────────────────────────
const getPlans = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const ip = getClientIP(req);
    const countryCode = yield (0, currency_1.getCountryFromIP)(ip);
    const currency = (0, currency_1.getCurrencyByCountry)(countryCode); // BD=BDT, else=GBP
    // Plans build করো
    const plans = yield Promise.all(Object.entries(subscription_service_1.PLAN_CONFIG).map((_a) => __awaiter(void 0, [_a], void 0, function* ([key, value]) {
        // BD হলে BDT তেই দেখাও, অন্য country হলে GBP এ convert করো
        if (currency.code === "BDT") {
            return {
                plan: key,
                label: value.label,
                months: value.months,
                amountBDT: value.amount,
                amountConverted: value.amount,
                amountFormatted: `৳${value.amount.toLocaleString()}`,
                currency,
                exchangeRate: 1,
                chargeNote: null,
            };
        }
        // GBP convert
        const { converted, formatted, rate } = yield (0, currency_1.convertBDTtoGBP)(value.amount);
        return {
            plan: key,
            label: value.label,
            months: value.months,
            amountBDT: value.amount, // actual EPS charge
            amountConverted: converted, // display only
            amountFormatted: formatted, // e.g. "£2.16"
            currency,
            exchangeRate: rate,
            chargeNote: `Approximate price. Charged as ৳${value.amount} BDT via payment gateway`,
        };
    })));
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Subscription plans fetched",
        data: {
            plans,
            detectedCountry: countryCode,
            detectedCurrency: currency,
        },
    });
}));
// ─── GET /api/v1/subscriptions/currency ──────────────────────────────────────
const getUserCurrency = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const ip = getClientIP(req);
    const countryCode = yield (0, currency_1.getCountryFromIP)(ip);
    const currency = (0, currency_1.getCurrencyByCountry)(countryCode);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Currency info fetched",
        data: { countryCode, currency, isBDT: currency.code === "BDT" },
    });
}));
// ─── POST /api/v1/subscriptions/initiate ─────────────────────────────────────
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
// ─── EPS Callback Helper ──────────────────────────────────────────────────────
const parseEPSCallbackData = (req) => {
    const result = {};
    for (const [key, val] of Object.entries(Object.assign(Object.assign({}, req.body), req.query))) {
        const cleanKey = String(key).trim();
        const cleanVal = String(val !== null && val !== void 0 ? val : "").trim();
        if (cleanKey)
            result[cleanKey] = cleanVal;
    }
    try {
        const rawUrl = req.url || "";
        const queryStart = rawUrl.indexOf("?");
        if (queryStart !== -1) {
            const decoded = decodeURIComponent(rawUrl.slice(queryStart + 1));
            for (const part of decoded.split(/\s*&\s*/)) {
                const eqIdx = part.indexOf("=");
                if (eqIdx === -1)
                    continue;
                const k = part.slice(0, eqIdx).trim();
                const v = part.slice(eqIdx + 1).trim();
                if (k)
                    result[k] = v;
            }
        }
    }
    catch (_) { }
    return result;
};
// ─── Payment Callbacks (unchanged) ───────────────────────────────────────────
const paymentSuccess = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const callbackData = parseEPSCallbackData(req);
    console.log("✅ EPS Success Callback:", callbackData);
    const normalizedData = {
        merchantTransactionId: callbackData.MerchantTransactionId ||
            callbackData.merchantTransactionId ||
            callbackData["MerchantTransactionId "] || "",
        status: callbackData.Status || callbackData.status || "",
        epsTransactionId: callbackData.EPSTransactionId ||
            callbackData.epsTransactionId ||
            callbackData["EPSTransactionId "] || "",
    };
    const tranId = normalizedData.merchantTransactionId || "unknown";
    if (!normalizedData.merchantTransactionId) {
        return res.redirect(`${envConfig_1.envVars.FRONTEND_URL}/paymentFail?reason=missing_transaction_id`);
    }
    try {
        const result = yield subscription_service_1.SubscriptionService.handlePaymentSuccess(normalizedData);
        if (result === null || result === void 0 ? void 0 : result.alreadyProcessed) {
            return res.redirect(`${envConfig_1.envVars.FRONTEND_URL}/paymentSuccess?status=already_processed`);
        }
        return res.redirect(`${envConfig_1.envVars.FRONTEND_URL}/paymentSuccess?tran_id=${tranId}`);
    }
    catch (err) {
        console.error("❌ Payment success callback error:", err);
        return res.redirect(`${envConfig_1.envVars.FRONTEND_URL}/paymentFail?tran_id=${tranId}`);
    }
}));
const paymentFail = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const callbackData = parseEPSCallbackData(req);
    yield subscription_service_1.SubscriptionService.handlePaymentFail(callbackData);
    res.redirect(`${envConfig_1.envVars.FRONTEND_URL}/paymentFail`);
}));
const paymentCancel = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const callbackData = parseEPSCallbackData(req);
    yield subscription_service_1.SubscriptionService.handlePaymentCancel(callbackData);
    res.redirect(`${envConfig_1.envVars.FRONTEND_URL}/paymentCancel`);
}));
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
    getUserCurrency,
    initiatePayment,
    paymentSuccess,
    paymentFail,
    paymentCancel,
    getMySubscription,
    getMyPaymentHistory,
};
