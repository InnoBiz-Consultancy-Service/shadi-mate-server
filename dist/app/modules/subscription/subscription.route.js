"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middleWares/auth.middleware");
const subscription_controller_1 = require("./subscription.controller");
const SubscriptionRoutes = (0, express_1.Router)();
// ─── Public ───────────────────────────────────────────────────────────────────
// GET /api/v1/subscriptions/plans
SubscriptionRoutes.get("/plans", subscription_controller_1.SubscriptionController.getPlans);
// EPS Callback URLs (Public — EPS server থেকে আসবে)
SubscriptionRoutes.post("/payment/success", subscription_controller_1.SubscriptionController.paymentSuccess);
SubscriptionRoutes.get("/payment/success", subscription_controller_1.SubscriptionController.paymentSuccess);
SubscriptionRoutes.post("/payment/fail", subscription_controller_1.SubscriptionController.paymentFail);
SubscriptionRoutes.get("/payment/fail", subscription_controller_1.SubscriptionController.paymentFail);
SubscriptionRoutes.post("/payment/cancel", subscription_controller_1.SubscriptionController.paymentCancel);
SubscriptionRoutes.get("/payment/cancel", subscription_controller_1.SubscriptionController.paymentCancel);
// ─── Protected ────────────────────────────────────────────────────────────────
// POST /api/v1/subscriptions/initiate
// Body: { plan: "1month" | "3month" | "6month" }
SubscriptionRoutes.post("/initiate", auth_middleware_1.authenticate, subscription_controller_1.SubscriptionController.initiatePayment);
// GET /api/v1/subscriptions/my
SubscriptionRoutes.get("/my", auth_middleware_1.authenticate, subscription_controller_1.SubscriptionController.getMySubscription);
// GET /api/v1/subscriptions/history
SubscriptionRoutes.get("/history", auth_middleware_1.authenticate, subscription_controller_1.SubscriptionController.getMyPaymentHistory);
exports.default = SubscriptionRoutes;
