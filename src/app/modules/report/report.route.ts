import { Router } from "express";
import { ReportController } from "./report.controller";
import authenticate, { authorize } from "../../../middleWares/auth.middleware";

const ReportRoutes = Router();

// ─── User Routes ──────────────────────────────────────────────────────────────

// POST /api/v1/reports/:userId
ReportRoutes.post("/:userId", authenticate, ReportController.submitReport);

// GET /api/v1/reports/my 
ReportRoutes.get("/my", authenticate, ReportController.getMyReports);

// ─── Admin Routes ─────────────────────────────────────────────────────────────

// GET /api/v1/reports 
ReportRoutes.get("/", authenticate, authorize("admin"), ReportController.getAllReports);

// PATCH /api/v1/reports/:id/status — Report status update (admin)
ReportRoutes.patch("/:id/status", authenticate, authorize("admin"), ReportController.updateReportStatus);

export default ReportRoutes;