
import sequelize from '../src/config/database';
import Employee from '../src/modules/hr/models/Employee';
import { Op } from 'sequelize';

async function fixStatuses() {
    try {
        await sequelize.authenticate();
        console.log('Connection established.');

        const [affectedCount] = await Employee.update(
            { status_karyawan_id: 1 }, // Set to Aktif (ID 1)
            {
                where: {
                    status_karyawan_id: { [Op.is]: null }
                }
            }
        );

        console.log(`Updated ${affectedCount} employees to Active status.`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

fixStatuses();
