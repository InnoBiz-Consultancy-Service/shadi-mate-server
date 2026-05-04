"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsletterController = void 0;
const catchAsync_1 = require("../../../utils/catchAsync");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const newsLatter_service_1 = require("./newsLatter.service");
const sendResponse_1 = require("../../../utils/sendResponse");
const subscribe = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield newsLatter_service_1.NewsletterService.subscribe(req.body);
    (0, sendResponse_1.SendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Subscription successful. Confirmation email sent.",
        data: result,
    });
}));
const getAllSubscribers = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield newsLatter_service_1.NewsletterService.getAllSubscribers();
    (0, sendResponse_1.SendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Subscribers retrieved successfully",
        data: result,
    });
}));
const getSubscriberById = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield newsLatter_service_1.NewsletterService.getSubscriberById(id);
    if (!result) {
        return (0, sendResponse_1.SendResponse)(res, {
            statusCode: http_status_codes_1.default.NOT_FOUND,
            success: false,
            message: "Subscriber not found",
            data: null,
        });
    }
    (0, sendResponse_1.SendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Subscriber retrieved successfully",
        data: result,
    });
}));
const deleteSubscriber = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield newsLatter_service_1.NewsletterService.deleteSubscriber(id);
    if (!result) {
        return (0, sendResponse_1.SendResponse)(res, {
            statusCode: http_status_codes_1.default.NOT_FOUND,
            success: false,
            message: "Subscriber not found",
            data: null,
        });
    }
    (0, sendResponse_1.SendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Subscriber deleted successfully",
        data: result,
    });
}));
const unsubscribe = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    const result = yield newsLatter_service_1.NewsletterService.unsubscribe(email);
    (0, sendResponse_1.SendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Successfully unsubscribed from newsletter.",
        data: result,
    });
}));
exports.NewsletterController = {
    subscribe,
    getAllSubscribers,
    getSubscriberById,
    deleteSubscriber,
    unsubscribe
};
