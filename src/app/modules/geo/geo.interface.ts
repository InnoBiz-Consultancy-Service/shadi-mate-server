import { Document } from "mongoose";

export interface IUniversity extends Document {
    name: string;
    shortName?: string;
    type: "govt" | "private";
}

export interface IDivision extends Document {
    name: string;
}

export interface IDistrict extends Document {
    name: string;
    divisionId: string;
}

export interface IThana extends Document {
    name: string;
    districtId: string;
}
