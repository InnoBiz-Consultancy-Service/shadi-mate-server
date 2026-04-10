"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const profileVisit_controller_1 = require("./profileVisit.controller");
const auth_middleware_1 = __importDefault(require("../../../middleWares/auth.middleware"));
const ProfileVisitRoutes = (0, express_1.Router)();
// GET /api/v1/profile-visits/count
ProfileVisitRoutes.get("/count", auth_middleware_1.default, profileVisit_controller_1.ProfileVisitController.getVisitCount);
// GET /api/v1/profile-visits?page=1&limit=20
ProfileVisitRoutes.get("/", auth_middleware_1.default, profileVisit_controller_1.ProfileVisitController.getProfileVisitors);
exports.default = ProfileVisitRoutes;
