import { Router } from "express";
import { SubscriptionController } from "./subscription.controller";
import authenticate from "../../../middleWares/auth.middleware";
import { paymentLimiter } from "../../../middleWares/rateLimiter";

const SubscriptionRoutes = Router();

// ─── Public ───────────────────────────────────────────────────────────────────
SubscriptionRoutes.get("/plans", SubscriptionController.getPlans);
SubscriptionRoutes.get("/currency", SubscriptionController.getUserCurrency);

// EPS payment callbacks — gateway থেকে আসে, rate limit দেওয়া যাবে না
SubscriptionRoutes.post("/payment/success", SubscriptionController.paymentSuccess);
SubscriptionRoutes.get("/payment/success", SubscriptionController.paymentSuccess);
SubscriptionRoutes.post("/payment/fail", SubscriptionController.paymentFail);
SubscriptionRoutes.get("/payment/fail", SubscriptionController.paymentFail);
SubscriptionRoutes.post("/payment/cancel", SubscriptionController.paymentCancel);
SubscriptionRoutes.get("/payment/cancel", SubscriptionController.paymentCancel);

// ─── Protected ────────────────────────────────────────────────────────────────

// POST /api/v1/subscriptions/initiate — 10/hour per user (fraud prevention)
SubscriptionRoutes.post(
  "/initiate",
  authenticate,
  paymentLimiter,
  SubscriptionController.initiatePayment
);

// GET /api/v1/subscriptions/my
SubscriptionRoutes.get("/my", authenticate, SubscriptionController.getMySubscription);

// GET /api/v1/subscriptions/history
SubscriptionRoutes.get(
  "/history",
  authenticate,
  SubscriptionController.getMyPaymentHistory
);

export default SubscriptionRoutes;