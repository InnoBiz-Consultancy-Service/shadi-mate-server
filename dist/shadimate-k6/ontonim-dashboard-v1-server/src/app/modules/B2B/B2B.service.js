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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartnershipRequestService = void 0;
const B2B_email_1 = require("./B2B.email");
const B2B_model_1 = require("./B2B.model");
const createPartnershipRequest = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Create new partnership request
    const result = yield B2B_model_1.PartnershipRequest.create(payload);
    // Send emails (both partner confirmation and internal notification)
    try {
        yield Promise.all([
            B2B_email_1.PartnershipEmailService.sendPartnerConfirmation(result),
            B2B_email_1.PartnershipEmailService.sendInternalNotification(result, result._id.toString())
        ]);
    }
    catch (error) {
        console.error("Failed to send emails:", error);
        // Don't throw - request is already saved
    }
    return result;
});
const getAllPartnershipRequests = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield B2B_model_1.PartnershipRequest.find({
        isDeleted: false
    }).sort({ createdAt: -1 });
    return result;
});
const getPartnershipRequestById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield B2B_model_1.PartnershipRequest.findOne({
        _id: id,
        isDeleted: false
    });
    return result;
});
const updatePartnershipStatus = (id, status) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield B2B_model_1.PartnershipRequest.findByIdAndUpdate(id, { status }, { new: true });
    return result;
});
const deletePartnershipRequest = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield B2B_model_1.PartnershipRequest.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    return result;
});
exports.PartnershipRequestService = {
    createPartnershipRequest,
    getAllPartnershipRequests,
    getPartnershipRequestById,
    updatePartnershipStatus,
    deletePartnershipRequest
};
