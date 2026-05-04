"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contact_controller_1 = require("./contact.controller");
const contact_validation_1 = require("./contact.validation");
const validateRequest_1 = require("../../../utils/validateRequest");
const ContactRoutes = (0, express_1.Router)();
// Public route - Submit contact form
ContactRoutes.post("/", (0, validateRequest_1.validateRequest)(contact_validation_1.contactRequestValidationSchema), contact_controller_1.ContactController.submitContactForm);
// Admin routes - Get all contact requests (add auth middleware later)
ContactRoutes.get("/", contact_controller_1.ContactController.getAllContactRequests);
// Admin routes - Get single contact request
ContactRoutes.get("/:id", contact_controller_1.ContactController.getContactRequestById);
// Admin routes - Delete contact request
ContactRoutes.delete("/:id", contact_controller_1.ContactController.deleteContactRequest);
exports.default = ContactRoutes;
