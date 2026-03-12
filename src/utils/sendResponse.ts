import { Response } from "express";

interface TMeta {
    total: number;
}

interface TResponse<T> {
    statusCode: number;
    success: boolean;
    message: string;
    token?: string;
    data?: T;
    meta?: TMeta;
}

export const sendResponse = <T>(res: Response, payload: TResponse<T>) => {
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