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
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedSuperAdmin = void 0;
const user_interface_1 = require("../app/modules/user/user.interface");
const envConfig_1 = require("../config/envConfig");
const user_model_1 = require("../app/modules/user/user.model");
const seedSuperAdmin = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isSuperAdminExist = yield user_model_1.User.findOne({ email: envConfig_1.envVars.SUPER_ADMIN_EMAIL });
        if (isSuperAdminExist) {
            console.log("Super Admin Already Exist");
            return;
        }
        const payload = {
            name: "Shadi Mate",
            role: user_interface_1.TUserRole.ADMIN,
            email: envConfig_1.envVars.SUPER_ADMIN_EMAIL,
            password: envConfig_1.envVars.SUPER_ADMIN_PASSWORD,
            isVerified: true,
            phone: "01711111111",
            isDeleted: false,
        };
        const superAdmin = yield user_model_1.User.create(payload);
        console.log(superAdmin, "super admin created");
    }
    catch (error) {
        console.log(error);
    }
});
exports.seedSuperAdmin = seedSuperAdmin;
