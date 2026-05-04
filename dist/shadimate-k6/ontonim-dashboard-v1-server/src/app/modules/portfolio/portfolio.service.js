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
exports.ProjectService = void 0;
const portfolio_model_1 = require("./portfolio.model");
const AppError_1 = __importDefault(require("../../../helpers/AppError"));
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const createProject = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield portfolio_model_1.Project.create(payload);
    return result;
});
const getAllProjects = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield portfolio_model_1.Project.find({ isDeleted: false })
        .sort({ createdAt: -1 });
    return result;
});
const getProjectById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield portfolio_model_1.Project.findOne({
        _id: id,
        isDeleted: false
    });
    if (!result) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Project not found");
    }
    return result;
});
const updateProject = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield portfolio_model_1.Project.findOneAndUpdate({ _id: id, isDeleted: false }, payload, { new: true, runValidators: true });
    if (!result) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Project not found");
    }
    return result;
});
const deleteProject = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield portfolio_model_1.Project.findOneAndUpdate({ _id: id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!result) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Project not found");
    }
    return result;
});
exports.ProjectService = {
    createProject,
    getAllProjects,
    getProjectById,
    updateProject,
    deleteProject
};
