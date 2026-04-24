import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../../utils/catchAsync";
import { sendResponse } from "../../../utils/sendResponse";
import { SubscriptionService, PLAN_CONFIG } from "./subscription.service";
import { envVars } from "../../../config/envConfig";
import AppError from "../../../helpers/AppError";

// ─── Get Plans ────────────────────────────────────────────────────────────────
const getPlans = catchAsync(async (req: Request, res: Response) => {
    const plans = Object.entries(PLAN_CONFIG).map(([key, value]) => ({
        plan:     key,
        label:    value.label,
        amount:   value.amount,
        months:   value.months,
        currency: "BDT",
    }));

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Subscription plans fetched",
        data: plans,
    });
});

// ─── Initiate Payment ─────────────────────────────────────────────────────────
const initiatePayment = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const { plan } = req.body;

    if (!plan || !["1month", "3month", "6month"].includes(plan)) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            "Invalid plan. Choose: 1month, 3month, or 6month"
        );
    }

    const result = await SubscriptionService.initiatePayment(userId, plan);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Payment initiated. Redirect user to paymentUrl.",
        data: result,
    });
});

// ─── Helper: Parse EPS callback data (handles spaces in query params) ──────────
// EPS sandbox sends malformed query strings like:
// EPSTransactionId%20=%20A261517110424A%20&%20ErrorCode=
// We need to manually parse this
const parseEPSCallbackData = (req: Request): Record<string, string> => {
    const result: Record<string, string> = {};

    // First collect from req.body and req.query (standard parsed values)
    for (const [key, val] of Object.entries({ ...req.body, ...req.query })) {
        const cleanKey = String(key).trim();
        const cleanVal = String(val ?? "").trim();
        if (cleanKey) result[cleanKey] = cleanVal;
    }

    // Also manually parse the raw query string to catch EPS's malformed params
    // e.g. "EPSTransactionId%20=%20A261517" → key="EPSTransactionId", val="A261517"
    try {
        const rawUrl = req.url || "";
        const queryStart = rawUrl.indexOf("?");
        if (queryStart !== -1) {
            const rawQuery = rawUrl.slice(queryStart + 1);
            // Decode first, then split
            const decoded = decodeURIComponent(rawQuery);
            // Split by & (may have spaces around it)
            const parts = decoded.split(/\s*&\s*/);
            for (const part of parts) {
                // Split by = (may have spaces around it)
                const eqIdx = part.indexOf("=");
                if (eqIdx === -1) continue;
                const k = part.slice(0, eqIdx).trim();
                const v = part.slice(eqIdx + 1).trim();
                if (k) result[k] = v;
            }
        }
    } catch (_) {
        // ignore parse errors, fallback to req.query is fine
    }

    return result;
};

// ─── Payment Success Callback ─────────────────────────────────────────────────
const paymentSuccess = catchAsync(async (req: Request, res: Response) => {
    const callbackData = parseEPSCallbackData(req);

    console.log("✅ EPS Success Callback - Parsed Data:", callbackData);

    // Normalize: EPS may send Status or status
    const normalizedData = {
        merchantTransactionId:
            callbackData.MerchantTransactionId ||
            callbackData.merchantTransactionId ||
            callbackData["MerchantTransactionId "] || // trailing space variant
            "",
        status:
            callbackData.Status ||
            callbackData.status ||
            "",
        epsTransactionId:
            callbackData.EPSTransactionId ||
            callbackData.epsTransactionId ||
            callbackData["EPSTransactionId "] || // trailing space variant
            "",
    };

    console.log("✅ Normalized payment data:", normalizedData);

    const tranId = normalizedData.merchantTransactionId || "unknown";

    if (!normalizedData.merchantTransactionId) {
        console.error("❌ No merchantTransactionId found in callback:", callbackData);
        return res.redirect(`${envVars.FRONTEND_URL}/paymentFail?reason=missing_transaction_id`);
    }

    try {
        const result = await SubscriptionService.handlePaymentSuccess(normalizedData);

        if (result?.alreadyProcessed) {
            return res.redirect(
                `${envVars.FRONTEND_URL}/paymentSuccess?status=already_processed`
            );
        }

        return res.redirect(
            `${envVars.FRONTEND_URL}/paymentSuccess?tran_id=${tranId}`
        );
    } catch (err) {
        console.error("❌ Payment success callback error:", err);
        return res.redirect(`${envVars.FRONTEND_URL}/paymentFail?tran_id=${tranId}`);
    }
});

// ─── Payment Fail Callback ────────────────────────────────────────────────────
const paymentFail = catchAsync(async (req: Request, res: Response) => {
    const callbackData = parseEPSCallbackData(req);
    console.log("❌ EPS Fail Callback:", callbackData);
    await SubscriptionService.handlePaymentFail(callbackData);
    res.redirect(`${envVars.FRONTEND_URL}/paymentFail`);
});

// ─── Payment Cancel Callback ──────────────────────────────────────────────────
const paymentCancel = catchAsync(async (req: Request, res: Response) => {
    const callbackData = parseEPSCallbackData(req);
    console.log("🚫 EPS Cancel Callback:", callbackData);
    await SubscriptionService.handlePaymentCancel(callbackData);
    res.redirect(`${envVars.FRONTEND_URL}/paymentCancel`);
});

// ─── Get My Subscription ──────────────────────────────────────────────────────
const getMySubscription = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const result = await SubscriptionService.getMySubscription(userId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result ? "Active subscription fetched" : "No active subscription",
        data: result,
    });
});

// ─── Get Payment History ──────────────────────────────────────────────────────
const getMyPaymentHistory = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const page  = parseInt(req.query.page as string)  || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await SubscriptionService.getMyPaymentHistory(userId, page, limit);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Payment history fetched",
        data: result.payments,
        meta: result.meta as any,
    });
});

export const SubscriptionController = {
    getPlans,
    initiatePayment,
    paymentSuccess,
    paymentFail,
    paymentCancel,
    getMySubscription,
    getMyPaymentHistory,
};