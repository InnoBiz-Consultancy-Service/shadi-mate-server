import { Router } from "express";
import { GeoController } from "./geo.controller";

const GeoRoutes = Router();

// Universities
GeoRoutes.get("/universities", GeoController.getUniversities);

// Divisions
GeoRoutes.get("/divisions", GeoController.getDivisions);

// Districts under a division
GeoRoutes.get("/divisions/:divisionId/districts", GeoController.getDistrictsByDivision);

// Thanas under a district
GeoRoutes.get("/districts/:districtId/thanas", GeoController.getThanasByDistrict);

export default GeoRoutes;
