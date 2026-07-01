import { QueryInterface } from 'sequelize';
import { Migration } from '../umzug';

export const up: Migration = async ({ context: queryInterface }) => {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];

    // Ensure employees exist for seeding
    try {
        await queryInterface.bulkInsert('employees', [
            {
                id: 101,
                nama_lengkap: 'Test Emp 1',
                nomor_induk_karyawan: 'TEST001',
                email_perusahaan: 'test1@co.com',
                "createdAt": new Date(),
                "updatedAt": new Date()
            },
            {
                id: 102,
                nama_lengkap: 'Test Emp 2',
                nomor_induk_karyawan: 'TEST002',
                email_perusahaan: 'test2@co.com',
                "createdAt": new Date(),
                "updatedAt": new Date()
            },
            {
                id: 103,
                nama_lengkap: 'Test Emp 3',
                nomor_induk_karyawan: 'TEST003',
                email_perusahaan: 'test3@co.com',
                "createdAt": new Date(),
                "updatedAt": new Date()
            },
            {
                id: 104,
                nama_lengkap: 'Test Emp 4',
                nomor_induk_karyawan: 'TEST004',
                email_perusahaan: 'test4@co.com',
                "createdAt": new Date(),
                "updatedAt": new Date()
            },
            {
                id: 105,
                nama_lengkap: 'Test Emp 5',
                nomor_induk_karyawan: 'TEST005',
                email_perusahaan: 'test5@co.com',
                "createdAt": new Date(),
                "updatedAt": new Date()
            }
        ]);
    } catch (e) {
        // Ignore if exists or specific error
        console.log('Employees insert warning (might exist):', e);
    }

    // Seed Leaves
    await queryInterface.bulkInsert('leaves', [
        {
            employee_id: 101,
            tanggal_mulai: dateString,
            tanggal_selesai: dateString,
            jenis: 'Izin',
            status: 'Approved',
            created_at: new Date(),
            updated_at: new Date()
        },
        {
            employee_id: 102,
            tanggal_mulai: dateString,
            tanggal_selesai: dateString,
            jenis: 'Cuti',
            status: 'Approved',
            created_at: new Date(),
            updated_at: new Date()
        },
        {
            employee_id: 103,
            tanggal_mulai: dateString,
            tanggal_selesai: dateString,
            jenis: 'Cuti',
            status: 'Pending',
            created_at: new Date(),
            updated_at: new Date()
        }
    ]);

    // Seed Attendances
    await queryInterface.bulkInsert('attendances', [
        {
            employee_id: 104,
            tanggal: dateString,
            status: 'Hadir',
            jam_masuk: '08:00:00',
            created_at: new Date(),
            updated_at: new Date()
        },
        {
            employee_id: 105,
            tanggal: dateString,
            status: 'Hadir',
            jam_masuk: '08:15:00',
            created_at: new Date(),
            updated_at: new Date()
        },
        {
            employee_id: 101,
            tanggal: dateString,
            status: 'Ijin',
            created_at: new Date(),
            updated_at: new Date()
        },
        {
            employee_id: 102,
            tanggal: dateString,
            status: 'Sakit',
            created_at: new Date(),
            updated_at: new Date()
        }
    ]);
};

export const down: Migration = async ({ context: queryInterface }) => {
    // We don't delete employees here to be safe
    await queryInterface.bulkDelete('attendances', {});
    await queryInterface.bulkDelete('leaves', {});
};
