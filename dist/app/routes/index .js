"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const user_router_1 = __importDefault(require("../modules/user/user.router"));
const geo_router_1 = __importDefault(require("../modules/geo/geo.router"));
const profile_route_1 = require("../modules/profile/profile.route");
const personalityQuestions_route_1 = require("../modules/personalityQuestion/personalityQuestions.route");
const dreamPartner_route_1 = require("../modules/dreamPartner/dreamPartner.route");
const chat_route_1 = require("../modules/chat/chat.route");
const like_route_1 = __importDefault(require("../modules/like/like.route"));
const notification_route_1 = __importDefault(require("../modules/notification/notification.route"));
const ignore_route_1 = __importDefault(require("../modules/ignore/ignore.route"));
const block_route_1 = __importDefault(require("../modules/block/block.route"));
const report_route_1 = __importDefault(require("../modules/report/report.route"));
const profileVisit_route_1 = __importDefault(require("../modules/profileVisit/profileVisit.route"));
const subscription_route_1 = __importDefault(require("../modules/subscription/subscription.route"));
const album_route_1 = require("../modules/album/album.route");
const email_route_1 = require("../modules/email/email.route");
exports.router = (0, express_1.Router)();
const moduleRoutes = [
    {
        path: "/auth",
        route: user_router_1.default
    },
    {
        path: "/geo",
        route: geo_router_1.default
    },
    {
        path: "/profile",
        route: profile_route_1.ProfileRoutes
    },
    {
        path: "/personality-test",
        route: personalityQuestions_route_1.PersonalityQuestionRoutes
    },
    {
        path: "/dream-partner",
        route: dreamPartner_route_1.DreamPartnerRoutes
    },
    {
        path: "/chat",
        route: chat_route_1.ChatRoutes
    },
    {
        path: "/notifications",
        route: notification_route_1.default
    },
    {
        path: "/likes",
        route: like_route_1.default
    },
    {
        path: "/ignore",
        route: ignore_route_1.default
    },
    {
        path: "/block",
        route: block_route_1.default
    },
    {
        path: "/report",
        route: report_route_1.default
    },
    {
        path: "/profile-visits",
        route: profileVisit_route_1.default
    },
    {
        path: "/subscriptions",
        route: subscription_route_1.default
    },
    {
        path: "/album",
        route: album_route_1.AlbumRoutes
    },
    {
        path: "/emails",
        route: email_route_1.EmailRoute
    }
];
moduleRoutes.forEach((route) => {
    exports.router.use(route.path, route.route);
});
