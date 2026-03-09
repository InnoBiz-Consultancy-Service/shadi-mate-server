"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Thana = exports.District = exports.Division = exports.University = void 0;
const mongoose_1 = require("mongoose");
// ─── University Model ─────────────────────────────────────────────────────────
const UniversitySchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true, unique: true },
    shortName: { type: String, trim: true },
    type: { type: String, enum: ["govt", "private"], required: true },
}, { timestamps: true });
exports.University = (0, mongoose_1.model)("University", UniversitySchema);
// ─── Division Model ───────────────────────────────────────────────────────────
const DivisionSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true, unique: true },
}, { timestamps: true });
exports.Division = (0, mongoose_1.model)("Division", DivisionSchema);
// ─── District Model ───────────────────────────────────────────────────────────
const DistrictSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    divisionId: { type: String, required: true },
}, { timestamps: true });
exports.District = (0, mongoose_1.model)("District", DistrictSchema);
// ─── Thana Model ──────────────────────────────────────────────────────────────
const ThanaSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    districtId: { type: String, required: true },
}, { timestamps: true });
exports.Thana = (0, mongoose_1.model)("Thana", ThanaSchema);
