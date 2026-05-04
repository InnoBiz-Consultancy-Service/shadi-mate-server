"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendResponse = void 0;
const SendResponse = (res, data) => {
    res.status(data.statusCode).json({
        StatusCode: data.statusCode,
        success: data.success,
        message: data.message,
        meta: data.meta,
        data: data.data
    });
};
exports.SendResponse = SendResponse;
