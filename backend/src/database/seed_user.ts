import sequelize from '../config/database';
import User from '../modules/auth/models/User';
import { Role } from '../modules/auth/models/Role';
import { Employee } from '../modules/hr/models/Employee';

const seedUser = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // Ambil employee pertama (jika ada) untuk ditautkan dengan user
        const firstEmployee = await Employee.findOne();

        // Ambil role superadmin yang telah ada dari migrasi
        const role = await Role.findOne({ where: { name: 'superadmin' } });
        if (!role) {
            throw new Error('Role superadmin tidak ditemukan di database. Pastikan migrasi sudah dijalankan.');
        }

        // Hapus user jika sudah ada untuk memastikan password benar
        await User.destroy({ where: { nik: '111111' } });
        await User.destroy({ where: { nik: '1234567890123456' } });

        // User creation will automatically hash the password via beforeCreate hook
        await User.create({
            nama: 'Superadmin Example',
            nik: '111111',
            password: 'password123',
            role_id: role.id,
            employee_id: firstEmployee ? firstEmployee.id : null,
            is_active: true
        });

        await User.create({
            nama: 'Superadmin Full',
            nik: '1234567890123456',
            password: 'password123',
            role_id: role.id,
            is_active: true
        });

        console.log('Admin users seeded successfully!');
    } catch (error) {
        console.error('Error seeding users:', error);
    } finally {
        process.exit(0);
    }
};

seedUser();
