"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedSuperAdmin = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const user_interface_1 = require("../app/modules/user/user.interface");
const envConfig_1 = require("../config/envConfig");
const user_model_1 = require("../app/modules/user/user.model");
const seedSuperAdmin = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isSuperAdminExist = yield user_model_1.User.findOne({
            email: envConfig_1.envVars.SUPER_ADMIN_EMAIL,
        });
        if (isSuperAdminExist) {
            console.log("✅ Super Admin Already Exists");
            return;
        }
        // 🔐 HASH PASSWORD
        const hashedPassword = yield bcryptjs_1.default.hash(envConfig_1.envVars.SUPER_ADMIN_PASSWORD, 12);
        const payload = {
            name: "Shadi Mate",
            role: user_interface_1.TUserRole.ADMIN,
            email: envConfig_1.envVars.SUPER_ADMIN_EMAIL,
            password: hashedPassword, // ✅ FIXED
            isVerified: true,
            phone: "01711111111",
            isDeleted: false,
            subscription: "premium",
        };
        const superAdmin = yield user_model_1.User.create(payload);
        console.log("🔥 Super Admin Created Successfully");
    }
    catch (error) {
        console.log("❌ Seeder Error:", error);
    }
});
exports.seedSuperAdmin = seedSuperAdmin;
