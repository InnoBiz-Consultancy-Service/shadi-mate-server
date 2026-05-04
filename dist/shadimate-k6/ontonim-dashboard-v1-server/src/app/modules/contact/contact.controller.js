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
exports.ContactController = void 0;
const catchAsync_1 = require("../../../utils/catchAsync");
const contact_service_1 = require("./contact.service");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const sendResponse_1 = require("../../../utils/sendResponse");
const submitContactForm = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield contact_service_1.ContactService.createContactRequest(req.body);
    (0, sendResponse_1.SendResponse)(res, {
        statusCode: http_status_codes_1.default.CREATED,
        success: true,
        message: "Your request has been submitted successfully.",
        data: result
    });
}));
const getAllContactRequests = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield contact_service_1.ContactService.getAllContactRequests();
    (0, sendResponse_1.SendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Contact requests retrieved successfully",
        data: result
    });
}));
const getContactRequestById = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield contact_service_1.ContactService.getContactRequestById(id);
    if (!result) {
        (0, sendResponse_1.SendResponse)(res, {
            statusCode: http_status_codes_1.default.NOT_FOUND,
            success: false,
            message: "Contact request not found",
            data: null
        });
        return;
    }
    (0, sendResponse_1.SendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Contact request retrieved successfully",
        data: result
    });
}));
const deleteContactRequest = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield contact_service_1.ContactService.deleteContactRequest(id);
    if (!result) {
        (0, sendResponse_1.SendResponse)(res, {
            statusCode: http_status_codes_1.default.NOT_FOUND,
            success: false,
            message: "Contact request not found",
            data: null
        });
        return;
    }
    (0, sendResponse_1.SendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Contact request deleted successfully",
        data: result
    });
}));
exports.ContactController = {
    submitContactForm,
    getAllContactRequests,
    getContactRequestById,
    deleteContactRequest
};
