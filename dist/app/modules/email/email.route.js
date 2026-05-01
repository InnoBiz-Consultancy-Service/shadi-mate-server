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
exports.EmailRoute = void 0;
const express_1 = require("express");
const email_controller_1 = require("./email.controller");
const auth_middleware_1 = __importStar(require("../../../middleWares/auth.middleware"));
const router = (0, express_1.Router)();
// send email (all / free / premium / selected)
router.post("/send", auth_middleware_1.default, (0, auth_middleware_1.authorize)("admin"), email_controller_1.EmailController.sendEmail);
// preview আগে দেখার জন্য
router.post("/preview", auth_middleware_1.default, (0, auth_middleware_1.authorize)("admin"), email_controller_1.EmailController.preview);
// search users (selected mode)
router.get("/users/search", auth_middleware_1.default, (0, auth_middleware_1.authorize)("admin"), email_controller_1.EmailController.searchUsers);
// stats
router.get("/stats", auth_middleware_1.default, (0, auth_middleware_1.authorize)("admin"), email_controller_1.EmailController.getStats);
// campaigns list
router.get("/", auth_middleware_1.default, (0, auth_middleware_1.authorize)("admin"), email_controller_1.EmailController.getAllCampaigns);
// single campaign
router.get("/:id", auth_middleware_1.default, (0, auth_middleware_1.authorize)("admin"), email_controller_1.EmailController.getCampaignById);
exports.EmailRoute = router;
