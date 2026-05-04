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
exports.ContactService = void 0;
const contact_model_1 = require("./contact.model");
const createContactRequest = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Create new contact request
    const result = yield contact_model_1.ContactRequest.create(payload);
    return result;
});
const getAllContactRequests = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield contact_model_1.ContactRequest.find().sort({ createdAt: -1 });
    return result;
});
const getContactRequestById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield contact_model_1.ContactRequest.findById(id);
    return result;
});
const deleteContactRequest = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield contact_model_1.ContactRequest.findByIdAndDelete(id);
    return result;
});
exports.ContactService = {
    createContactRequest,
    getAllContactRequests,
    getContactRequestById,
    deleteContactRequest
};
