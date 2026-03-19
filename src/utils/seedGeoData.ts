import { Division, District, Thana, University } from "../app/modules/geo/geo.model";
import { geoSeedData, universitySeedData } from "../data/geoSeedData";
import { Types } from "mongoose";

export const seedGeoData = async () => {
    try {
        console.log("🌱 Starting database seeding...");

        // ── Seed Universities ────────────────────────────────────────────────────
        const uniCount = await University.countDocuments();
        if (uniCount === 0) {
            await University.insertMany(universitySeedData);
            console.log(`✅ Seeded ${universitySeedData.length} universities`);
        } else {
            console.log(`✅ Universities already exist (${uniCount} found)`);
        }

        // ── Check if we have ALL divisions (should be 8) ─────────────────────────
        const divCount = await Division.countDocuments();
        const expectedDivisions = geoSeedData.length; // This should be 8

        console.log(`📊 Found ${divCount} divisions, expecting ${expectedDivisions}`);

        // If divisions count doesn't match expected, clear and reseed everything
        if (divCount !== expectedDivisions) {
            if (divCount > 0) {
                console.log("⚠️ Incomplete or incorrect geo data found. Clearing existing data...");
                await Division.deleteMany({});
                await District.deleteMany({});
                await Thana.deleteMany({});
                console.log("✅ Cleared all existing geo data");
            }

          

            for (const divData of geoSeedData) {
                // Create division - FIXED: Type assertion for _id
                const division = await Division.create({ name: divData.division });
                const divisionId = (division._id as Types.ObjectId).toString();
                console.log(`  📌 Created division: ${divData.division}`);

                let districtCount = 0;
                let thanaCount = 0;

                for (const distData of divData.districts) {
                    // Create district - FIXED: Type assertion for _id
                    const district = await District.create({
                        name: distData.name,
                        divisionId: divisionId,
                    });
                    const districtId = (district._id as Types.ObjectId).toString();
                    districtCount++;

                    // Create thanas for this district
                    const thanas = distData.thanas.map((thanaName) => ({
                        name: thanaName,
                        districtId: districtId,
                    }));

                    await Thana.insertMany(thanas);
                    thanaCount += thanas.length;
                }

                console.log(`     ├─ Districts: ${districtCount}, Thanas: ${thanaCount}`);
            }

          

            // Verify the counts
            const finalDivCount = await Division.countDocuments();
            const finalDistCount = await District.countDocuments();
            const finalThanaCount = await Thana.countDocuments();

            console.log("📊 Final counts after seeding:");
            console.log(`   ├─ Divisions: ${finalDivCount}`);
            console.log(`   ├─ Districts: ${finalDistCount}`);
            console.log(`   └─ Thanas: ${finalThanaCount}`);

        } else {
            console.log("✅ Geo data already exists and is complete");

            // Show current counts
            const distCount = await District.countDocuments();
            const thanaCount = await Thana.countDocuments();
            console.log(`📊 Current counts - Divisions: ${divCount}, Districts: ${distCount}, Thanas: ${thanaCount}`);
        }

 

    } catch (error) {
        console.error("❌ Error seeding geo data:", error);
    }
};