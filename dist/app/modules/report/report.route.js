"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const report_controller_1 = require("./report.controller");
const auth_middleware_1 = __importStar(require("../../../middleWares/auth.middleware"));
const rateLimiter_1 = require("../../../middleWares/rateLimiter");
const ReportRoutes = (0, express_1.Router)();
// ─── User Routes ──────────────────────────────────────────────────────────────
// POST /api/v1/report/:userId — 5/hour per user
ReportRoutes.post("/:userId", auth_middleware_1.default, rateLimiter_1.reportLimiter, report_controller_1.ReportController.submitReport);
// GET /api/v1/report/my
ReportRoutes.get("/my", auth_middleware_1.default, report_controller_1.ReportController.getMyReports);
// ─── Admin Routes ─────────────────────────────────────────────────────────────
// GET /api/v1/report
ReportRoutes.get("/", auth_middleware_1.default, (0, auth_middleware_1.authorize)("admin"), report_controller_1.ReportController.getAllReports);
// PATCH /api/v1/report/:id/status
ReportRoutes.patch("/:id/status", auth_middleware_1.default, (0, auth_middleware_1.authorize)("admin"), report_controller_1.ReportController.updateReportStatus);
exports.default = ReportRoutes;
