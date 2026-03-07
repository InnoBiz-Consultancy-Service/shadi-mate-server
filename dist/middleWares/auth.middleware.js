"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../helpers/AppError"));
const envConfig_1 = require("../config/envConfig");
const authenticate = (req, res, next) => {
    const authReq = req;
    let token;
    const authHeader = authReq.headers.authorization;
    if (authHeader) {
        // যদি Bearer থাকে
        if (authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        }
        else {
            // Bearer না থাকলেও পুরো header কে token ধরা হবে
            token = authHeader;
        }
    }
    // fallback: x-access-token header check
    if (!token && authReq.headers["x-access-token"]) {
        token = authReq.headers["x-access-token"];
    }
    if (!token) {
        return next(new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Access denied. No token provided"));
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, envConfig_1.envVars.JWT_SECRET);
        authReq.user = decoded;
        next();
    }
    catch (_a) {
        return next(new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Invalid or expired token"));
    }
};
exports.authenticate = authenticate;
const authorize = (...roles) => {
    return (req, res, next) => {
        const authReq = req;
        if (!authReq.user || !roles.includes(authReq.user.role)) {
            return next(new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "You do not have permission to perform this action"));
        }
        next();
    };
};
exports.authorize = authorize;
