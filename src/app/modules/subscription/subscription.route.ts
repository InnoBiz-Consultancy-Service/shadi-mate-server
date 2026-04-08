import { Router } from "express";
import { authenticate } from "../../../middleWares/auth.middleware";
import { SubscriptionController } from "./subscription.controller";

const SubscriptionRoutes = Router();

// ─── Public ───────────────────────────────────────────────────────────────────

// GET /api/v1/subscriptions/plans
SubscriptionRoutes.get("/plans", SubscriptionController.getPlans);

// EPS Callback URLs (Public — EPS server থেকে আসবে)
SubscriptionRoutes.post("/payment/success", SubscriptionController.paymentSuccess);
SubscriptionRoutes.get("/payment/success",  SubscriptionController.paymentSuccess);
SubscriptionRoutes.post("/payment/fail",    SubscriptionController.paymentFail);
SubscriptionRoutes.get("/payment/fail",     SubscriptionController.paymentFail);
SubscriptionRoutes.post("/payment/cancel",  SubscriptionController.paymentCancel);
SubscriptionRoutes.get("/payment/cancel",   SubscriptionController.paymentCancel);

// ─── Protected ────────────────────────────────────────────────────────────────

// POST /api/v1/subscriptions/initiate
// Body: { plan: "1month" | "3month" | "6month" }
SubscriptionRoutes.post("/initiate", authenticate, SubscriptionController.initiatePayment);

// GET /api/v1/subscriptions/my
SubscriptionRoutes.get("/my", authenticate, SubscriptionController.getMySubscription);

// GET /api/v1/subscriptions/history
SubscriptionRoutes.get("/history", authenticate, SubscriptionController.getMyPaymentHistory);

export default SubscriptionRoutes;