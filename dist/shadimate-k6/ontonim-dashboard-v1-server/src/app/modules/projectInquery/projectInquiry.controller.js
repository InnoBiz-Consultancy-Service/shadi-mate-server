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
exports.ProjectInquiryController = void 0;
const catchAsync_1 = require("../../../utils/catchAsync");
const projectInquiry_service_1 = require("./projectInquiry.service");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const sendResponse_1 = require("../../../utils/sendResponse");
const submitProjectInquiry = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield projectInquiry_service_1.ProjectInquiryService.createProjectInquiry(req.body);
    (0, sendResponse_1.SendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Your project inquiry has been submitted successfully.",
        data: result,
    });
}));
const getAllProjectInquiries = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield projectInquiry_service_1.ProjectInquiryService.getAllProjectInquiries();
    (0, sendResponse_1.SendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Project inquiries retrieved successfully",
        data: result,
    });
}));
const getProjectInquiryById = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield projectInquiry_service_1.ProjectInquiryService.getProjectInquiryById(id);
    if (!result) {
        return (0, sendResponse_1.SendResponse)(res, {
            success: false,
            statusCode: http_status_codes_1.default.NOT_FOUND,
            message: "Project inquiry not found",
            data: undefined
        });
    }
    (0, sendResponse_1.SendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Project inquiry retrieved successfully",
        data: result,
    });
}));
const deleteProjectInquiry = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield projectInquiry_service_1.ProjectInquiryService.deleteProjectInquiry(id);
    if (!result) {
        return (0, sendResponse_1.SendResponse)(res, {
            success: false,
            statusCode: http_status_codes_1.default.NOT_FOUND,
            message: "Project inquiry not found",
            data: undefined
        });
    }
    (0, sendResponse_1.SendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Project inquiry deleted successfully",
        data: result,
    });
}));
exports.ProjectInquiryController = {
    submitProjectInquiry,
    getAllProjectInquiries,
    getProjectInquiryById,
    deleteProjectInquiry,
};
