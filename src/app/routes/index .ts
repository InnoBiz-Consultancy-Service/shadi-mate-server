import { Router } from "express"
import UserRoutes from "../modules/user/user.router"
import GeoRoutes from "../modules/geo/geo.router"
import { ProfileRoutes } from "../modules/profile/profile.route"

export const router = Router()

const moduleRoutes = [
    {
        path: "/auth",
        route: UserRoutes
    },
    {
        path: "/geo",
        route: GeoRoutes
    },
    {
        path: "/profile",
        route: ProfileRoutes
    }
]


moduleRoutes.forEach((route) => {
    router.use(route.path, route.route)
})

// router.use("/user", UserRoutes)
// router.use("/tour", TourRoutes)
// router.use("/division", DivisionRoutes)
// router.use("/booking", BookingRoutes)
// router.use("/user", UserRoutes)