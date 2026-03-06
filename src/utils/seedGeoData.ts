import { Division, District, Thana, University } from "../app/modules/geo/geo.model";
import { geoSeedData, universitySeedData } from "../data/geoSeedData";

export const seedGeoData = async () => {
    try {
        // ── Seed Universities ────────────────────────────────────────────────────
        const uniCount = await University.countDocuments();
        if (uniCount === 0) {
            await University.insertMany(universitySeedData);
            console.log(`✅ Seeded ${universitySeedData.length} universities`);
        }

        // ── Seed Divisions → Districts → Thanas ──────────────────────────────────
        const divCount = await Division.countDocuments();
        if (divCount === 0) {
            for (const divData of geoSeedData) {
                const division = await Division.create({ name: divData.division });
                const divisionId = (division._id as unknown as { toString(): string }).toString();

                for (const distData of divData.districts) {
                    const district = await District.create({
                        name: distData.name,
                        divisionId: divisionId,
                    });
                    const districtId = (district._id as unknown as { toString(): string }).toString();

                    const thanas = distData.thanas.map((thanaName) => ({
                        name: thanaName,
                        districtId: districtId,
                    }));

                    await Thana.insertMany(thanas);
                }
            }
            console.log("✅ Seeded all divisions, districts, and thanas");
        }
    } catch (error) {
        console.error("❌ Error seeding geo data:", error);
    }
};
