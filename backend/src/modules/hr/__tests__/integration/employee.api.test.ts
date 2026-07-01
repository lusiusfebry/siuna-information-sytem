import request from 'supertest';
import { app } from '../../../../index';
import User from '../../../auth/models/User';
import authService from '../../../auth/services/auth.service';
import Divisi from '../../models/Divisi';
import Department from '../../models/Department';
import PosisiJabatan from '../../models/PosisiJabatan';
import StatusKaryawan from '../../models/StatusKaryawan';
import Employee from '../../models/Employee';
import { Role } from '../../../auth/models/Role';

describe('Employee API Integration (Real DB)', () => {
    let adminToken: string;
    let divisiId: number;
    let departmentId: number;
    let posisiId: number;
    let statusId: number;
    let testUser: User;

    beforeAll(async () => {
        try {
            console.log('Employee test setup starting...');
            // Find or create Superadmin role
            const [role] = await Role.findOrCreate({
                where: { name: 'superadmin' },
                defaults: {
                    name: 'superadmin',
                    display_name: 'Superadmin',
                    is_system_role: true
                }
            });

            // Create admin user
            testUser = await User.create({
                nama: 'Admin HR Test',
                nik: '777777',
                password: 'password123',
                role_id: role.id,
                is_active: true
            });

            const userWithRole = await User.findByPk(testUser.id, {
                include: [{ model: Role, as: 'roleDetails' }]
            });
            adminToken = authService.generateToken(userWithRole!);

            // Seed Master Data
            const divisi = await Divisi.create({ nama: 'Integrated IT' });
            divisiId = divisi.id;

            const dept = await Department.create({
                nama: 'Integrated Dev',
                divisi_id: divisiId
            });
            departmentId = dept.id;

            const pos = await PosisiJabatan.create({
                nama: 'Integrated Engineer',
                department_id: departmentId
            });
            posisiId = pos.id;

            const status = await StatusKaryawan.create({
                nama: 'Aktif'
            });
            statusId = status.id;
            console.log('Employee test setup completed');
        } catch (error: any) {
            console.error('EMPLOYEE SETUP ERROR:', error.message);
            throw error;
        }
    });

    afterAll(async () => {
        try {
            console.log('Employee test cleanup starting...');
            await Employee.destroy({ where: {}, force: true });
            await User.destroy({ where: { nik: '777777' } });
            await PosisiJabatan.destroy({ where: { id: posisiId } });
            await Department.destroy({ where: { id: departmentId } });
            await Divisi.destroy({ where: { id: divisiId } });
            await StatusKaryawan.destroy({ where: { id: statusId } });
            console.log('Employee test cleanup completed');
        } catch (e) {
            console.error('Cleanup error:', e);
        }
    });

    describe('POST /api/hr/employees', () => {
        it('should create a new employee with full details', async () => {
            const newEmployee = {
                nama_lengkap: 'Integration Test Employee',
                nomor_induk_karyawan: 'EMP-2024-001',
                email_perusahaan: 'test_int@company.com',
                nomor_handphone: '08123456789',
                divisi_id: divisiId,
                department_id: departmentId,
                posisi_jabatan_id: posisiId,
                status_karyawan_id: statusId,
                jenis_kelamin: 'Laki-laki',
                tempat_lahir: 'Jakarta',
                tanggal_lahir: '1990-01-01',
                agama: 'Islam',
                status_pernikahan: 'Lajang',
                alamat_domisili: 'Jl. Test No. 1',
                tanggal_masuk: '2024-01-01',
            };

            const res = await request(app)
                .post('/api/hr/employees')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(newEmployee);

            expect(res.status).toBe(201);
            expect(res.body.status).toBe('success');
            expect(res.body.data).toHaveProperty('id');
            expect(res.body.data.nama_lengkap).toBe(newEmployee.nama_lengkap);

            // Verify DB Persistence
            const created = await Employee.findOne({
                where: { nomor_induk_karyawan: newEmployee.nomor_induk_karyawan },
                include: ['personal_info', 'hr_info']
            });
            expect(created).not.toBeNull();
            expect(created?.personal_info?.tempat_lahir).toBe(newEmployee.tempat_lahir);
        });

        it('should validate unique NIK', async () => {
            const employee = {
                nama_lengkap: 'Duplicate NIK Employee',
                nomor_induk_karyawan: 'EMP-2024-001',
                divisi_id: divisiId,
                jenis_kelamin: 'Laki-laki'
            };

            const res = await request(app)
                .post('/api/hr/employees')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(employee);

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('NIK already exists');
        });
    });

    describe('GET /api/hr/employees', () => {
        it('should get list of employees', async () => {
            const res = await request(app)
                .get('/api/hr/employees')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toBeInstanceOf(Array);
            expect(res.body.data.some((e: any) => e.nomor_induk_karyawan === 'EMP-2024-001')).toBe(true);
        });
    });
});
