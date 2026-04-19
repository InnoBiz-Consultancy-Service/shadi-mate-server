"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileRoutes = void 0;
const express_1 = __importDefault(require("express"));
const profile_controller_1 = require("./profile.controller");
const auth_middleware_1 = __importDefault(require("../../../middleWares/auth.middleware"));
const router = express_1.default.Router();
// ─── Create Profile ─────────────────────────
router.post("/", auth_middleware_1.default, profile_controller_1.ProfileController.createProfile);
// ─── Update Profile ─────────────────────────
router.patch("/", auth_middleware_1.default, profile_controller_1.ProfileController.updateProfile);
// ─── Get Profiles (Search + Filter) ─────────────────
router.get("/", auth_middleware_1.default, profile_controller_1.ProfileController.getProfiles);
// ─── Get My Profile ─────────────────────────
router.get("/my", auth_middleware_1.default, profile_controller_1.ProfileController.getMyProfile);
// ─── Get Profile by ID ─────────────────────────
router.get("/:userId", auth_middleware_1.default, profile_controller_1.ProfileController.getProfileById);
exports.ProfileRoutes = router;
