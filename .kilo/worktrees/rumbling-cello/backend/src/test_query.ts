
import sequelize from './config/database';
import * as models from './modules/hr/models';

async function testQuery() {
    try {
        await sequelize.authenticate();
        const divisiId = 1; // SDM & Umum
        console.log(`Testing query for divisi_id: ${divisiId}...`);

        const departments = await (models as any).Department.findAll({
            where: { divisi_id: divisiId }
        });

        console.log(`Found ${departments.length} departments:`);
        departments.forEach((d: any) => {
            console.log(`- ID: ${d.id}, Nama: "${d.nama}", Status: ${d.status}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await sequelize.close();
    }
}

testQuery();
