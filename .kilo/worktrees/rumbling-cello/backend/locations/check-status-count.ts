
import sequelize from '../src/config/database';
import StatusKaryawan from '../src/modules/hr/models/StatusKaryawan';
import Employee from '../src/modules/hr/models/Employee';

async function checkStatus() {
    try {
        await sequelize.authenticate();
        console.log('Connection established.');

        const statuses = await StatusKaryawan.findAll();
        console.log('All Status Karyawan:', JSON.stringify(statuses, null, 2));

        const employees = await Employee.findAll({
            attributes: ['id', 'nama_lengkap', 'status_karyawan_id'],
            include: [{ model: StatusKaryawan, as: 'status_karyawan' }]
        });

        console.log('Employees with Status:', JSON.stringify(employees.map(e => ({
            id: e.id,
            name: e.nama_lengkap,
            status_id: e.status_karyawan_id,
            status_data: e.status_karyawan
        })), null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkStatus();
