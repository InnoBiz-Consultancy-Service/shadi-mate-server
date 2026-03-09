"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const geo_controller_1 = require("./geo.controller");
const GeoRoutes = (0, express_1.Router)();
// Universities
GeoRoutes.get("/universities", geo_controller_1.GeoController.getUniversities);
// Divisions
GeoRoutes.get("/divisions", geo_controller_1.GeoController.getDivisions);
// Districts under a division
GeoRoutes.get("/divisions/:divisionId/districts", geo_controller_1.GeoController.getDistrictsByDivision);
// Thanas under a district
GeoRoutes.get("/districts/:districtId/thanas", geo_controller_1.GeoController.getThanasByDistrict);
exports.default = GeoRoutes;
