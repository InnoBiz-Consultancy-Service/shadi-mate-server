import { Router } from "express"
import UserRoutes from "../modules/user/user.router"
import GeoRoutes from "../modules/geo/geo.router"
import { ProfileRoutes } from "../modules/profile/profile.route"
import { PersonalityQuestionRoutes } from "../modules/personalityQuestion/personalityQuestions.route"
import { DreamPartnerRoutes } from "../modules/dreamPartner/dreamPartner.route"
import { ChatRoutes } from "../modules/chat/chat.route"
import LikeRoutes from "../modules/like/like.route"

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
    },
    {
        path: "/personality-test",
        route: PersonalityQuestionRoutes
    },
    {
        path: "/dream-partner",
        route: DreamPartnerRoutes
    },
    {
        path: "/chat",
        route: ChatRoutes
    },
    {
        path: "/likes",
        route: LikeRoutes
    }
]


moduleRoutes.forEach((route) => {
    router.use(route.path, route.route)
})

