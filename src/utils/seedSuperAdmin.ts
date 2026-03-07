
import bcryptjs from "bcryptjs"
import { IUser, TUserRole } from "../app/modules/user/user.interface"
import { envVars } from "../config/envConfig"
import { User } from "../app/modules/user/user.model"

export const seedSuperAdmin = async () => {
    try {

        const isSuperAdminExist = await User.findOne({ email: envVars.SUPER_ADMIN_EMAIL })
        if (isSuperAdminExist) {
            console.log("Super Admin Already Exist")
            return

        }



        const payload: Partial<IUser> = {
            name: "Shadi Mate",
            role: TUserRole.ADMIN,
            email: envVars.SUPER_ADMIN_EMAIL,
            password: envVars.SUPER_ADMIN_PASSWORD,
            isVerified: true,
            phone: "01711111111",
            isDeleted: false,


        }

        const superAdmin = await User.create(payload)
        console.log(superAdmin, "super admin created")

    } catch (error) {
        console.log(error)

    }
}