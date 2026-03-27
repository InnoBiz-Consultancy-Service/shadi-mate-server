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
const dreamPartner_route_1 = require("../dreamPartner/dreamPartner.route");
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
    }
];
moduleRoutes.forEach((route) => {
    exports.router.use(route.path, route.route);
});
