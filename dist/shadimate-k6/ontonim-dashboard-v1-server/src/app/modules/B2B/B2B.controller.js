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
exports.PartnershipRequestController = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const catchAsync_1 = require("../../../utils/catchAsync");
const B2B_service_1 = require("./B2B.service");
const sendResponse_1 = require("../../../utils/sendResponse");
const submitPartnershipRequest = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield B2B_service_1.PartnershipRequestService.createPartnershipRequest(req.body);
    (0, sendResponse_1.SendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Your partnership request has been submitted successfully.",
        data: result
    });
}));
const getAllPartnershipRequests = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield B2B_service_1.PartnershipRequestService.getAllPartnershipRequests();
    (0, sendResponse_1.SendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Partnership requests retrieved successfully",
        data: result
    });
}));
const getPartnershipRequestById = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield B2B_service_1.PartnershipRequestService.getPartnershipRequestById(id);
    (0, sendResponse_1.SendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Partnership request retrieved successfully",
        data: result
    });
}));
const updatePartnershipStatus = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { status } = req.body;
    const result = yield B2B_service_1.PartnershipRequestService.updatePartnershipStatus(id, status);
    (0, sendResponse_1.SendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Partnership status updated successfully",
        data: result
    });
}));
const deletePartnershipRequest = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield B2B_service_1.PartnershipRequestService.deletePartnershipRequest(id);
    (0, sendResponse_1.SendResponse)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Partnership request deleted successfully",
        data: result
    });
}));
exports.PartnershipRequestController = {
    submitPartnershipRequest,
    getAllPartnershipRequests,
    getPartnershipRequestById,
    updatePartnershipStatus,
    deletePartnershipRequest
};
