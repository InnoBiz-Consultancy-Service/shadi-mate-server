import { Router } from "express";
import { ReportController } from "./report.controller";
import authenticate, { authorize } from "../../../middleWares/auth.middleware";
import { reportLimiter } from "../../../middleWares/rateLimiter";

const ReportRoutes = Router();

// ─── User Routes ──────────────────────────────────────────────────────────────

// POST /api/v1/report/:userId — 5/hour per user
ReportRoutes.post(
  "/:userId",
  authenticate,
  reportLimiter,
  ReportController.submitReport
);

// GET /api/v1/report/my
ReportRoutes.get("/my", authenticate, ReportController.getMyReports);

// ─── Admin Routes ─────────────────────────────────────────────────────────────

// GET /api/v1/report
ReportRoutes.get("/", authenticate, authorize("admin"), ReportController.getAllReports);

// PATCH /api/v1/report/:id/status
ReportRoutes.patch(
  "/:id/status",
  authenticate,
  authorize("admin"),
  ReportController.updateReportStatus
);

export default ReportRoutes;