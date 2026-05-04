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
exports.NewsletterService = void 0;
const AppError_1 = __importDefault(require("../../../helpers/AppError"));
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const newsLatter_model_1 = require("./newsLatter.model");
const newsLatter_email_service_1 = require("./newsLatter.email.service");
const subscribe = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = payload;
    // Check for duplicate subscription
    const existingSubscriber = yield newsLatter_model_1.Subscriber.findOne({ email });
    if (existingSubscriber) {
        throw new AppError_1.default(http_status_codes_1.default.CONFLICT, "This email is already subscribed.");
    }
    // Create new subscriber
    const result = yield newsLatter_model_1.Subscriber.create(payload);
    // Send confirmation email (non-blocking)
    newsLatter_email_service_1.NewsletterEmailService.sendConfirmationEmail(email).catch((err) => {
        console.error("Failed to send confirmation email:", err);
    });
    return result;
});
const getAllSubscribers = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield newsLatter_model_1.Subscriber.find().sort({ createdAt: -1 });
    return result;
});
const getSubscriberById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield newsLatter_model_1.Subscriber.findById(id);
    return result;
});
const deleteSubscriber = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield newsLatter_model_1.Subscriber.findByIdAndDelete(id);
    return result;
});
const unsubscribe = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield newsLatter_model_1.Subscriber.findOneAndDelete({ email });
    if (!result) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Email not found in subscribers list.");
    }
    return result;
});
exports.NewsletterService = {
    subscribe,
    getAllSubscribers,
    getSubscriberById,
    deleteSubscriber,
    unsubscribe
};
