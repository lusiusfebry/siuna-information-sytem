
import sequelize from '../src/config/database';
import StatusKaryawan from '../src/modules/hr/models/StatusKaryawan';

async function listStatuses() {
    try {
        await sequelize.authenticate();
        console.log('Connection established.');

        const statuses = await StatusKaryawan.findAll();
        console.log('All Status Karyawan:');
        statuses.forEach((s: any) => {
            console.log(`ID: ${s.id}, Nama: ${s.nama}, Status: ${s.status}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

listStatuses();
