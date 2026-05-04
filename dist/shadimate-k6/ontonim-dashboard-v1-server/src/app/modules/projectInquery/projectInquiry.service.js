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
exports.ProjectInquiryService = void 0;
const projectInquiry_model_1 = require("./projectInquiry.model");
const projectInquiry_email_service_1 = require("./projectInquiry.email.service");
const createProjectInquiry = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Create new project inquiry
    const result = yield projectInquiry_model_1.ProjectInquiry.create(payload);
    // Send emails (both user confirmation and internal notification)
    try {
        yield Promise.all([
            projectInquiry_email_service_1.ProjectInquiryEmailService.sendUserConfirmation(result),
            projectInquiry_email_service_1.ProjectInquiryEmailService.sendInternalNotification(result)
        ]);
    }
    catch (error) {
        console.error("Failed to send emails:", error);
        // Don't throw - inquiry is already saved
    }
    return result;
});
const getAllProjectInquiries = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield projectInquiry_model_1.ProjectInquiry.find({ isDeleted: false }).sort({ createdAt: -1 });
    return result;
});
const getProjectInquiryById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield projectInquiry_model_1.ProjectInquiry.findOne({ _id: id, isDeleted: false });
    return result;
});
const deleteProjectInquiry = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield projectInquiry_model_1.ProjectInquiry.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    return result;
});
exports.ProjectInquiryService = {
    createProjectInquiry,
    getAllProjectInquiries,
    getProjectInquiryById,
    deleteProjectInquiry
};
