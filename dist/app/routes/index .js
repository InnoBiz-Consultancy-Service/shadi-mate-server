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
    }
];
moduleRoutes.forEach((route) => {
    exports.router.use(route.path, route.route);
});
// router.use("/user", UserRoutes)
// router.use("/tour", TourRoutes)
// router.use("/division", DivisionRoutes)
// router.use("/booking", BookingRoutes)
// router.use("/user", UserRoutes)
