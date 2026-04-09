import { Router } from "express"
import UserRoutes from "../modules/user/user.router"
import GeoRoutes from "../modules/geo/geo.router"
import { ProfileRoutes } from "../modules/profile/profile.route"
import { PersonalityQuestionRoutes } from "../modules/personalityQuestion/personalityQuestions.route"
import { DreamPartnerRoutes } from "../modules/dreamPartner/dreamPartner.route"
import { ChatRoutes } from "../modules/chat/chat.route"
import LikeRoutes from "../modules/like/like.route"
import NotificationRoutes from "../modules/notification/notification.route"
import IgnoreRoutes from "../modules/ignore/ignore.route"
import BlockRoutes from "../modules/block/block.route"
import ReportRoutes from "../modules/report/report.route"
import ProfileVisitRoutes from "../modules/profileVisit/profileVisit.route"
import SubscriptionRoutes from "../modules/subscription/subscription.route"

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
        path: "/notifications",
        route: NotificationRoutes
    },
    {
        path: "/likes",
        route: LikeRoutes
    },
    {
        path: "/ignore",
        route: IgnoreRoutes
    },
    {
        path: "/block",
        route: BlockRoutes
    },
    {
        path: "/report",
        route: ReportRoutes
    },
    {
        path: "/profile-visits",
        route: ProfileVisitRoutes
    },
    {
        path: "/subscriptions",
        route: SubscriptionRoutes
    }
]


moduleRoutes.forEach((route) => {
    router.use(route.path, route.route)
})

