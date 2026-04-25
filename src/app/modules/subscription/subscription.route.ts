import { Router } from "express";
import { SubscriptionController } from "./subscription.controller";
import authenticate from "../../../middleWares/auth.middleware";

const SubscriptionRoutes = Router();

// ─── Public ───────────────────────────────────────────────────────────────────


SubscriptionRoutes.get("/plans", SubscriptionController.getPlans);


SubscriptionRoutes.get("/currency", SubscriptionController.getUserCurrency);

SubscriptionRoutes.post("/payment/success", SubscriptionController.paymentSuccess);
SubscriptionRoutes.get("/payment/success",  SubscriptionController.paymentSuccess);
SubscriptionRoutes.post("/payment/fail",    SubscriptionController.paymentFail);
SubscriptionRoutes.get("/payment/fail",     SubscriptionController.paymentFail);
SubscriptionRoutes.post("/payment/cancel",  SubscriptionController.paymentCancel);
SubscriptionRoutes.get("/payment/cancel",   SubscriptionController.paymentCancel);

// ─── Protected ────────────────────────────────────────────────────────────────

// POST /api/v1/subscriptions/initiate
SubscriptionRoutes.post("/initiate", authenticate, SubscriptionController.initiatePayment);

// GET /api/v1/subscriptions/my
SubscriptionRoutes.get("/my", authenticate, SubscriptionController.getMySubscription);

// GET /api/v1/subscriptions/history
SubscriptionRoutes.get("/history", authenticate, SubscriptionController.getMyPaymentHistory);

export default SubscriptionRoutes;