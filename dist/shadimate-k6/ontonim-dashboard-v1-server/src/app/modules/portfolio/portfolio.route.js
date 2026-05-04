"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const portfolio_validation_1 = require("./portfolio.validation");
const validateRequest_1 = require("../../../utils/validateRequest");
const portfolio_controller_1 = require("./portfolio.controller");
const ProjectRoutes = (0, express_1.Router)();
// Create new project
ProjectRoutes.post("/", (0, validateRequest_1.validateRequest)(portfolio_validation_1.createProjectValidationSchema), portfolio_controller_1.ProjectController.createProject);
// Get all projects
ProjectRoutes.get("/", portfolio_controller_1.ProjectController.getAllProjects);
// Get single project by ID
ProjectRoutes.get("/:id", portfolio_controller_1.ProjectController.getProjectById);
// Update project
ProjectRoutes.patch("/:id", (0, validateRequest_1.validateRequest)(portfolio_validation_1.updateProjectValidationSchema), portfolio_controller_1.ProjectController.updateProject);
// Delete project
ProjectRoutes.patch("/delete/:id", portfolio_controller_1.ProjectController.deleteProject);
exports.default = ProjectRoutes;
