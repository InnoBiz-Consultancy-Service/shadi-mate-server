"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const newsLatter_validation_1 = require("./newsLatter.validation");
const validateRequest_1 = require("../../../utils/validateRequest");
const newsLatter_controller_1 = require("./newsLatter.controller");
const NewsletterRoutes = (0, express_1.Router)();
// Public routes
NewsletterRoutes.post("/subscribe", (0, validateRequest_1.validateRequest)(newsLatter_validation_1.subscriberValidationSchema), newsLatter_controller_1.NewsletterController.subscribe);
NewsletterRoutes.post("/unsubscribe", (0, validateRequest_1.validateRequest)(newsLatter_validation_1.subscriberValidationSchema), newsLatter_controller_1.NewsletterController.unsubscribe);
// Admin routes (add auth middleware later)
NewsletterRoutes.get("/", newsLatter_controller_1.NewsletterController.getAllSubscribers);
NewsletterRoutes.get("/:id", newsLatter_controller_1.NewsletterController.getSubscriberById);
NewsletterRoutes.delete("/:id", newsLatter_controller_1.NewsletterController.deleteSubscriber);
exports.default = NewsletterRoutes;
