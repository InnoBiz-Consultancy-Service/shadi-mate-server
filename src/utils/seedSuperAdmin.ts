import bcrypt from "bcryptjs";
import { IUser, TUserRole } from "../app/modules/user/user.interface";
import { envVars } from "../config/envConfig";
import { User } from "../app/modules/user/user.model";

export const seedSuperAdmin = async () => {
    try {
        const isSuperAdminExist = await User.findOne({
            email: envVars.SUPER_ADMIN_EMAIL,
        });

        if (isSuperAdminExist) {
            console.log("✅ Super Admin Already Exists");
            return;
        }

        // 🔐 HASH PASSWORD
        const hashedPassword = await bcrypt.hash(
            envVars.SUPER_ADMIN_PASSWORD as string,
            12
        );

        const payload: Partial<IUser> = {
            name: "Shadi Mate",
            role: TUserRole.ADMIN,
            email: envVars.SUPER_ADMIN_EMAIL,
            password: hashedPassword, // ✅ FIXED
            isVerified: true,
            phone: "01711111111",
            isDeleted: false,
        };

        const superAdmin = await User.create(payload);

        console.log("🔥 Super Admin Created Successfully");
    } catch (error) {
        console.log("❌ Seeder Error:", error);
    }
};