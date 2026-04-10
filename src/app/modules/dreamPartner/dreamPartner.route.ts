// routes/dreamPartner.route.ts
import { Router } from "express";
import { getDreamPartnerMatches, saveDreamPartnerPreference } from "./dreamPartner.controller";
import authenticate from "../../../middleWares/auth.middleware";

const router = Router();

router.post("/", authenticate, saveDreamPartnerPreference);
router.get("/", authenticate, getDreamPartnerMatches);

export const DreamPartnerRoutes = router;