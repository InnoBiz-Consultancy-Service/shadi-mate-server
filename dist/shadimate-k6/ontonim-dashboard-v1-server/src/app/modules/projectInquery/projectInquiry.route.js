"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const projectInquiry_controller_1 = require("./projectInquiry.controller");
const projectInquiry_validation_1 = require("./projectInquiry.validation");
const rateLimit_1 = require("../../../middleWares/rateLimit");
const validateRequest_1 = require("../../../utils/validateRequest");
const ProjectInquiryRoutes = (0, express_1.Router)();
// Public route - Submit project inquiry
ProjectInquiryRoutes.post("/", rateLimit_1.projectInquiryLimiter, (0, validateRequest_1.validateRequest)(projectInquiry_validation_1.projectInquiryValidationSchema), projectInquiry_controller_1.ProjectInquiryController.submitProjectInquiry);
// Admin routes (add auth middleware later)
ProjectInquiryRoutes.get("/", projectInquiry_controller_1.ProjectInquiryController.getAllProjectInquiries);
ProjectInquiryRoutes.get("/:id", projectInquiry_controller_1.ProjectInquiryController.getProjectInquiryById);
ProjectInquiryRoutes.patch("/:id", projectInquiry_controller_1.ProjectInquiryController.deleteProjectInquiry);
exports.default = ProjectInquiryRoutes;
