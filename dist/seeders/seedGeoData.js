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
exports.seedGeoData = void 0;
const geo_model_1 = require("../app/modules/geo/geo.model");
const geoSeedData_1 = require("../data/geoSeedData");
const seedGeoData = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("🌱 Starting database seeding...");
        // ── Seed Universities ────────────────────────────────────────────────────
        const uniCount = yield geo_model_1.University.countDocuments();
        if (uniCount === 0) {
            yield geo_model_1.University.insertMany(geoSeedData_1.universitySeedData);
            console.log(`✅ Seeded ${geoSeedData_1.universitySeedData.length} universities`);
        }
        else {
            console.log(`✅ Universities already exist (${uniCount} found)`);
        }
        // ── Check if we have ALL divisions (should be 8) ─────────────────────────
        const divCount = yield geo_model_1.Division.countDocuments();
        const expectedDivisions = geoSeedData_1.geoSeedData.length; // This should be 8
        console.log(`📊 Found ${divCount} divisions, expecting ${expectedDivisions}`);
        // If divisions count doesn't match expected, clear and reseed everything
        if (divCount !== expectedDivisions) {
            if (divCount > 0) {
                console.log("⚠️ Incomplete or incorrect geo data found. Clearing existing data...");
                yield geo_model_1.Division.deleteMany({});
                yield geo_model_1.District.deleteMany({});
                yield geo_model_1.Thana.deleteMany({});
                console.log("✅ Cleared all existing geo data");
            }
            for (const divData of geoSeedData_1.geoSeedData) {
                // Create division - FIXED: Type assertion for _id
                const division = yield geo_model_1.Division.create({ name: divData.division });
                const divisionId = division._id.toString();
                console.log(`  📌 Created division: ${divData.division}`);
                let districtCount = 0;
                let thanaCount = 0;
                for (const distData of divData.districts) {
                    // Create district - FIXED: Type assertion for _id
                    const district = yield geo_model_1.District.create({
                        name: distData.name,
                        divisionId: divisionId,
                    });
                    const districtId = district._id.toString();
                    districtCount++;
                    // Create thanas for this district
                    const thanas = distData.thanas.map((thanaName) => ({
                        name: thanaName,
                        districtId: districtId,
                    }));
                    yield geo_model_1.Thana.insertMany(thanas);
                    thanaCount += thanas.length;
                }
                console.log(`     ├─ Districts: ${districtCount}, Thanas: ${thanaCount}`);
            }
            // Verify the counts
            const finalDivCount = yield geo_model_1.Division.countDocuments();
            const finalDistCount = yield geo_model_1.District.countDocuments();
            const finalThanaCount = yield geo_model_1.Thana.countDocuments();
            console.log("📊 Final counts after seeding:");
            console.log(`   ├─ Divisions: ${finalDivCount}`);
            console.log(`   ├─ Districts: ${finalDistCount}`);
            console.log(`   └─ Thanas: ${finalThanaCount}`);
        }
        else {
            console.log("✅ Geo data already exists and is complete");
            // Show current counts
            const distCount = yield geo_model_1.District.countDocuments();
            const thanaCount = yield geo_model_1.Thana.countDocuments();
            console.log(`📊 Current counts - Divisions: ${divCount}, Districts: ${distCount}, Thanas: ${thanaCount}`);
        }
    }
    catch (error) {
        console.error("❌ Error seeding geo data:", error);
    }
});
exports.seedGeoData = seedGeoData;
