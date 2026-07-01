
import { KategoriPangkat, Golongan, SubGolongan } from '../src/modules/hr/models';
import sequelize from '../src/config/database';

async function checkMasterData() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const kategori = await KategoriPangkat.findAll();
        console.log('\n--- Kategori Pangkat ---');
        kategori.forEach(k => console.log(`ID: ${k.id}, Nama: '${k.nama}'`));

        const golongan = await Golongan.findAll();
        console.log('\n--- Golongan ---');
        golongan.forEach(g => console.log(`ID: ${g.id}, Nama: '${g.nama}'`));

        const subGolongan = await SubGolongan.findAll();
        console.log('\n--- Sub Golongan ---');
        subGolongan.forEach(s => console.log(`ID: ${s.id}, Nama: '${s.nama}'`));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkMasterData();
