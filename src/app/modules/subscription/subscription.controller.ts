import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../../utils/catchAsync";
import { sendResponse } from "../../../utils/sendResponse";
import { SubscriptionService, PLAN_CONFIG } from "./subscription.service";
import { envVars } from "../../../config/envConfig";
import AppError from "../../../helpers/AppError";
import {
  getCountryFromIP,
  getCurrencyByCountry,
  convertBDTtoGBP,
} from "../../../utils/currency";

// ─── Real IP বের করা ──────────────────────────────────────────────────────────
const getClientIP = (req: Request): string => {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return (typeof forwarded === "string" ? forwarded : forwarded[0]).split(",")[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || "127.0.0.1";
};

// ─── GET /api/v1/subscriptions/plans ─────────────────────────────────────────
const getPlans = catchAsync(async (req: Request, res: Response) => {
  const ip          = getClientIP(req);
  const countryCode = await getCountryFromIP(ip);
  const currency    = getCurrencyByCountry(countryCode); // BD=BDT, else=GBP

  // Plans build করো
  const plans = await Promise.all(
    Object.entries(PLAN_CONFIG).map(async ([key, value]) => {
      // BD হলে BDT তেই দেখাও, অন্য country হলে GBP এ convert করো
      if (currency.code === "BDT") {
        return {
          plan:            key,
          label:           value.label,
          months:          value.months,
          amountBDT:       value.amount,
          amountConverted: value.amount,
          amountFormatted: `৳${value.amount.toLocaleString()}`,
          currency,
          exchangeRate:    1,
          chargeNote:      null,
        };
      }

      // GBP convert
      const { converted, formatted, rate } = await convertBDTtoGBP(value.amount);
      return {
        plan:            key,
        label:           value.label,
        months:          value.months,
        amountBDT:       value.amount,       // actual EPS charge
        amountConverted: converted,          // display only
        amountFormatted: formatted,          // e.g. "£2.16"
        currency,
        exchangeRate:    rate,
        chargeNote:      `Approximate price. Charged as ৳${value.amount} BDT via payment gateway`,
      };
    })
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Subscription plans fetched",
    data: {
      plans,
      detectedCountry:  countryCode,
      detectedCurrency: currency,
    },
  });
});

// ─── GET /api/v1/subscriptions/currency ──────────────────────────────────────
const getUserCurrency = catchAsync(async (req: Request, res: Response) => {
  const ip          = getClientIP(req);
  const countryCode = await getCountryFromIP(ip);
  const currency    = getCurrencyByCountry(countryCode);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Currency info fetched",
    data: { countryCode, currency, isBDT: currency.code === "BDT" },
  });
});

// ─── POST /api/v1/subscriptions/initiate ─────────────────────────────────────
const initiatePayment = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { plan } = req.body;

  if (!plan || !["1month", "3month", "6month"].includes(plan)) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid plan. Choose: 1month, 3month, or 6month");
  }

  const result = await SubscriptionService.initiatePayment(userId, plan);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Payment initiated. Redirect user to paymentUrl.",
    data: result,
  });
});

// ─── EPS Callback Helper ──────────────────────────────────────────────────────
const parseEPSCallbackData = (req: Request): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const [key, val] of Object.entries({ ...req.body, ...req.query })) {
    const cleanKey = String(key).trim();
    const cleanVal = String(val ?? "").trim();
    if (cleanKey) result[cleanKey] = cleanVal;
  }
  try {
    const rawUrl     = req.url || "";
    const queryStart = rawUrl.indexOf("?");
    if (queryStart !== -1) {
      const decoded = decodeURIComponent(rawUrl.slice(queryStart + 1));
      for (const part of decoded.split(/\s*&\s*/)) {
        const eqIdx = part.indexOf("=");
        if (eqIdx === -1) continue;
        const k = part.slice(0, eqIdx).trim();
        const v = part.slice(eqIdx + 1).trim();
        if (k) result[k] = v;
      }
    }
  } catch (_) {}
  return result;
};

// ─── Payment Callbacks (unchanged) ───────────────────────────────────────────
const paymentSuccess = catchAsync(async (req: Request, res: Response) => {
  const callbackData = parseEPSCallbackData(req);
  console.log("✅ EPS Success Callback:", callbackData);

  const normalizedData = {
    merchantTransactionId:
      callbackData.MerchantTransactionId ||
      callbackData.merchantTransactionId ||
      callbackData["MerchantTransactionId "] || "",
    status:
      callbackData.Status || callbackData.status || "",
    epsTransactionId:
      callbackData.EPSTransactionId ||
      callbackData.epsTransactionId ||
      callbackData["EPSTransactionId "] || "",
  };

  const tranId = normalizedData.merchantTransactionId || "unknown";
  if (!normalizedData.merchantTransactionId) {
    return res.redirect(`${envVars.FRONTEND_URL}/paymentFail?reason=missing_transaction_id`);
  }

  try {
    const result = await SubscriptionService.handlePaymentSuccess(normalizedData);
    if (result?.alreadyProcessed) {
      return res.redirect(`${envVars.FRONTEND_URL}/paymentSuccess?status=already_processed`);
    }
    return res.redirect(`${envVars.FRONTEND_URL}/paymentSuccess?tran_id=${tranId}`);
  } catch (err) {
    console.error("❌ Payment success callback error:", err);
    return res.redirect(`${envVars.FRONTEND_URL}/paymentFail?tran_id=${tranId}`);
  }
});

const paymentFail = catchAsync(async (req: Request, res: Response) => {
  const callbackData = parseEPSCallbackData(req);
  await SubscriptionService.handlePaymentFail(callbackData);
  res.redirect(`${envVars.FRONTEND_URL}/paymentFail`);
});

const paymentCancel = catchAsync(async (req: Request, res: Response) => {
  const callbackData = parseEPSCallbackData(req);
  await SubscriptionService.handlePaymentCancel(callbackData);
  res.redirect(`${envVars.FRONTEND_URL}/paymentCancel`);
});

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

const getMyPaymentHistory = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const page   = parseInt(req.query.page  as string) || 1;
  const limit  = parseInt(req.query.limit as string) || 10;
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
  getUserCurrency,
  initiatePayment,
  paymentSuccess,
  paymentFail,
  paymentCancel,
  getMySubscription,
  getMyPaymentHistory,
};