"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DreamPartnerRoutes = void 0;
// routes/dreamPartner.route.ts
const express_1 = require("express");
const dreamPartner_controller_1 = require("./dreamPartner.controller");
const auth_middleware_1 = require("../../middleWares/auth.middleware");
const router = (0, express_1.Router)();
router.post("/", auth_middleware_1.authenticate, dreamPartner_controller_1.saveDreamPartnerPreference);
router.get("/", auth_middleware_1.authenticate, dreamPartner_controller_1.getDreamPartnerMatches);
exports.DreamPartnerRoutes = router;
