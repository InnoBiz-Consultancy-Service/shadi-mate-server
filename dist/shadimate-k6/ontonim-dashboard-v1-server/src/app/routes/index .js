"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const contact_route_1 = __importDefault(require("../modules/contact/contact.route"));
const newsLatter_route_1 = __importDefault(require("../modules/newsLatter/newsLatter.route"));
const projectInquiry_route_1 = __importDefault(require("../modules/projectInquery/projectInquiry.route"));
const B2B_route_1 = __importDefault(require("../modules/B2B/B2B.route"));
const portfolio_route_1 = __importDefault(require("../modules/portfolio/portfolio.route"));
exports.router = (0, express_1.Router)();
const moduleRoutes = [
    {
        path: "/contact",
        route: contact_route_1.default
    },
    {
        path: "/newsletter",
        route: newsLatter_route_1.default
    },
    {
        path: "/project-inquiry",
        route: projectInquiry_route_1.default
    },
    {
        path: "/b2b",
        route: B2B_route_1.default
    },
    {
        path: "/portfolio",
        route: portfolio_route_1.default
    }
];
moduleRoutes.forEach((route) => {
    exports.router.use(route.path, route.route);
});
