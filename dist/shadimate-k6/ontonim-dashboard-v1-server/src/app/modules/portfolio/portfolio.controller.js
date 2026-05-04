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
exports.ProjectController = void 0;
const catchAsync_1 = require("../../../utils/catchAsync");
const portfolio_service_1 = require("./portfolio.service");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const createProject = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield portfolio_service_1.ProjectService.createProject(req.body);
    res.status(http_status_codes_1.default.CREATED).json({
        success: true,
        message: "Project created successfully",
        data: result
    });
}));
const getAllProjects = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield portfolio_service_1.ProjectService.getAllProjects();
    res.status(http_status_codes_1.default.OK).json({
        success: true,
        message: "Projects retrieved successfully",
        data: result
    });
}));
const getProjectById = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield portfolio_service_1.ProjectService.getProjectById(id);
    res.status(http_status_codes_1.default.OK).json({
        success: true,
        message: "Project retrieved successfully",
        data: result
    });
}));
const updateProject = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield portfolio_service_1.ProjectService.updateProject(id, req.body);
    res.status(http_status_codes_1.default.OK).json({
        success: true,
        message: "Project updated successfully",
        data: result
    });
}));
const deleteProject = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield portfolio_service_1.ProjectService.deleteProject(id);
    res.status(http_status_codes_1.default.OK).json({
        success: true,
        message: "Project deleted successfully",
        data: result
    });
}));
exports.ProjectController = {
    createProject,
    getAllProjects,
    getProjectById,
    updateProject,
    deleteProject
};
