import { model, Schema } from "mongoose";
import { IUniversity, IDivision, IDistrict, IThana } from "./geo.interface";

// ─── University Model ─────────────────────────────────────────────────────────
const UniversitySchema = new Schema<IUniversity>(
    {
        name: { type: String, required: true, trim: true, unique: true },
        shortName: { type: String, trim: true },
        type: { type: String, enum: ["govt", "private"], required: true },
    },
    { timestamps: true }
);

export const University = model<IUniversity>("University", UniversitySchema);

// ─── Division Model ───────────────────────────────────────────────────────────
const DivisionSchema = new Schema<IDivision>(
    {
        name: { type: String, required: true, trim: true, unique: true },
    },
    { timestamps: true }
);

export const Division = model<IDivision>("Division", DivisionSchema);

// ─── District Model ───────────────────────────────────────────────────────────
const DistrictSchema = new Schema<IDistrict>(
    {
        name: { type: String, required: true, trim: true },
        divisionId: { type: String, required: true },
    },
    { timestamps: true }
);

export const District = model<IDistrict>("District", DistrictSchema);

// ─── Thana Model ──────────────────────────────────────────────────────────────
const ThanaSchema = new Schema<IThana>(
    {
        name: { type: String, required: true, trim: true },
        districtId: { type: String, required: true },
    },
    { timestamps: true }
);

export const Thana = model<IThana>("Thana", ThanaSchema);
