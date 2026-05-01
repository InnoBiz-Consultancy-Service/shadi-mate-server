"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileRoutes = void 0;
const express_1 = __importDefault(require("express"));
const profile_controller_1 = require("./profile.controller");
const auth_middleware_1 = __importDefault(require("../../../middleWares/auth.middleware"));
const rateLimiter_1 = require("../../../middleWares/rateLimiter");
const router = express_1.default.Router();
// POST /api/v1/profile
router.post("/", auth_middleware_1.default, rateLimiter_1.userLimiter, profile_controller_1.ProfileController.createProfile);
// PATCH /api/v1/profile
router.patch("/", auth_middleware_1.default, rateLimiter_1.userLimiter, profile_controller_1.ProfileController.updateProfile);
// GET /api/v1/profile — search + browse
// profileSearchLimiter: 60/min — scraping prevent
router.get("/", auth_middleware_1.default, rateLimiter_1.profileSearchLimiter, profile_controller_1.ProfileController.getProfiles);
// GET /api/v1/profile/my
router.get("/my", auth_middleware_1.default, profile_controller_1.ProfileController.getMyProfile);
// GET /api/v1/profile/:userId
router.get("/:userId", auth_middleware_1.default, profile_controller_1.ProfileController.getProfileById);
exports.ProfileRoutes = router;
