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

// ─── Payment Success Callback ─────────────────────────────────────────────────
const paymentSuccess = catchAsync(async (req: Request, res: Response) => {
    const callbackData = { ...req.body, ...req.query };

    console.log("✅ EPS Success Callback Hit:", callbackData);

    // 🔥 IMPORTANT: normalize keys (EPS case mismatch fix)
    const normalizedData = {
        merchantTransactionId:
            callbackData.merchantTransactionId ||
            callbackData.MerchantTransactionId,

        status:
            callbackData.Status ||
            callbackData.status,

        epsTransactionId:
            callbackData.EPSTransactionId ||
            callbackData.epsTransactionId,
    };

    if (!normalizedData.merchantTransactionId) {
        console.error("❌ Missing MerchantTransactionId");
        return res.redirect(`${envVars.FRONTEND_URL}/payment/fail`);
    }

    try {
        const result = await SubscriptionService.handlePaymentSuccess(normalizedData);

        // 🔁 Duplicate callback safe
        if (result?.alreadyProcessed) {
            return res.redirect(
                `${envVars.FRONTEND_URL}/payment/success?status=already_processed`
            );
        }

        // ✅ SUCCESS redirect
        return res.redirect(
            `${envVars.FRONTEND_URL}/payment/success?tran_id=${normalizedData.merchantTransactionId}`
        );

    } catch (err) {
        console.error("❌ Payment success callback error:", err);

        return res.redirect(
            `${envVars.FRONTEND_URL}/payment/fail?tran_id=${normalizedData.merchantTransactionId}`
        );
    }
});
// ─── Payment Fail Callback ────────────────────────────────────────────────────
const paymentFail = catchAsync(async (req: Request, res: Response) => {
    const callbackData = { ...req.body, ...req.query };
    await SubscriptionService.handlePaymentFail(callbackData);
    res.redirect(`${envVars.FRONTEND_URL}/payment/fail`);
});

// ─── Payment Cancel Callback ──────────────────────────────────────────────────
const paymentCancel = catchAsync(async (req: Request, res: Response) => {
    const callbackData = { ...req.body, ...req.query };
    await SubscriptionService.handlePaymentCancel(callbackData);
    res.redirect(`${envVars.FRONTEND_URL}/payment/cancel`);
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