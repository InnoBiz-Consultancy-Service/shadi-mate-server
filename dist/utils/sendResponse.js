"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResponse = void 0;
const sendResponse = (res, payload) => {
    const { statusCode, success, message, token, data, meta } = payload;
    res.status(statusCode).json({
        statusCode,
        success,
        message,
        token,
        meta,
        data
    });
};
exports.sendResponse = sendResponse;
