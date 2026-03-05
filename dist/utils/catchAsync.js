"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catchAsync = void 0;
const envConfig_1 = require("../config/envConfig");
const catchAsync = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
        if (envConfig_1.envVars.NODE_ENV === "development") {
            console.error("Error:", err);
        }
        next(err);
    });
};
exports.catchAsync = catchAsync;
