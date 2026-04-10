import { Router } from "express";
import { ProfileVisitController } from "./profileVisit.controller";
import authenticate from "../../../middleWares/auth.middleware";
const ProfileVisitRoutes = Router();

// GET /api/v1/profile-visits/count
ProfileVisitRoutes.get("/count", authenticate, ProfileVisitController.getVisitCount);

// GET /api/v1/profile-visits?page=1&limit=20
ProfileVisitRoutes.get("/", authenticate, ProfileVisitController.getProfileVisitors);

export default ProfileVisitRoutes;