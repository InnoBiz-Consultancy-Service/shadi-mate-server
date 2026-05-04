"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = void 0;
const envConfig_1 = require("../config/envConfig");
const AppError_1 = __importDefault(require("../helpers/AppError"));
const globalErrorHandler = (err, req, res, next) => {
    if (envConfig_1.envVars.NODE_ENV === "development") {
        console.error("Error:", err);
    }
    let statusCode = 500;
    let message = `Something went wrong ${err.message}`;
    const errorSource = [{
        // path:"isDeleted",
        // message: "Cast error",
        }];
    if (err instanceof AppError_1.default) {
        statusCode = err.statusCode;
        message = err.message;
    }
    // duplicate key error
    else if (err.code === 11000) {
        const matchedArray = err.message.match(/"([^"]*)"/);
        statusCode = 400;
        message = `Duplicate field value: ${matchedArray[1]}.already exists.`;
    }
    // mongoDB objectId error
    else if (err.name === "castError") {
        statusCode = 400;
        message = `Invalid MongoDB ID: ${err.value}`;
    }
    // validation error 
    else if (err.name === "ValidationError") {
        statusCode = 400;
        const errors = Object.values(err.errors);
        errors.forEach((errorObject) => {
            errorSource.push({
                path: errorObject.path,
                message: errorObject.message,
            });
        });
    }
    // zod validation error
    else if (err.name === "ZodError") {
        statusCode = 400;
        message = "Zod Error";
        err.issues.forEach((issue) => {
            errorSource.push({
                path: issue.path[issue.path.length - 1],
                message: issue.message
            });
        });
    }
    else if (err instanceof Error) {
        statusCode = 500;
        message = err.message;
    }
    res.status(statusCode).json({
        success: false,
        message,
        errorSource,
        error: err,
        stack: envConfig_1.envVars.NODE_ENV === "development" ? err.stack : undefined
    });
};
exports.globalErrorHandler = globalErrorHandler;
