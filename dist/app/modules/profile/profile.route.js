"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../../../middleWares/auth.middleware");
const profile_controller_1 = require("./profile.controller");
const router = express_1.default.Router();
// ─── Create Profile ─────────────────────────
router.post("/", auth_middleware_1.authenticate, profile_controller_1.ProfileController.createProfile);
// ─── Update Profile ─────────────────────────
router.patch("/", auth_middleware_1.authenticate, profile_controller_1.ProfileController.updateProfile);
// ─── Get Profiles (Search + Filter) ─────────────────
router.get("/", auth_middleware_1.authenticate, profile_controller_1.ProfileController.getProfiles);
exports.ProfileRoutes = router;
