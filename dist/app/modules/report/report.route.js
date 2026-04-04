"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const report_controller_1 = require("./report.controller");
const auth_middleware_1 = require("../../../middleWares/auth.middleware");
const ReportRoutes = (0, express_1.Router)();
// ─── User Routes ──────────────────────────────────────────────────────────────
// POST /api/v1/reports/:userId
ReportRoutes.post("/:userId", auth_middleware_1.authenticate, report_controller_1.ReportController.submitReport);
// GET /api/v1/reports/my 
ReportRoutes.get("/my", auth_middleware_1.authenticate, report_controller_1.ReportController.getMyReports);
// ─── Admin Routes ─────────────────────────────────────────────────────────────
// GET /api/v1/reports 
ReportRoutes.get("/", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)("admin"), report_controller_1.ReportController.getAllReports);
// PATCH /api/v1/reports/:id/status — Report status update (admin)
ReportRoutes.patch("/:id/status", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)("admin"), report_controller_1.ReportController.updateReportStatus);
exports.default = ReportRoutes;
