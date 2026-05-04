"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const B2B_controller_1 = require("./B2B.controller");
const B2B_validation_1 = require("./B2B.validation");
const validateRequest_1 = require("../../../utils/validateRequest");
const PartnershipRequestRoutes = (0, express_1.Router)();
// Public route - Submit partnership request
PartnershipRequestRoutes.post("/", (0, validateRequest_1.validateRequest)(B2B_validation_1.partnershipRequestValidationSchema), B2B_controller_1.PartnershipRequestController.submitPartnershipRequest);
// Admin routes (add auth middleware later)
PartnershipRequestRoutes.get("/", B2B_controller_1.PartnershipRequestController.getAllPartnershipRequests);
PartnershipRequestRoutes.get("/:id", B2B_controller_1.PartnershipRequestController.getPartnershipRequestById);
PartnershipRequestRoutes.patch("/:id", B2B_controller_1.PartnershipRequestController.updatePartnershipStatus);
PartnershipRequestRoutes.patch("/:id/delete", B2B_controller_1.PartnershipRequestController.deletePartnershipRequest);
exports.default = PartnershipRequestRoutes;
