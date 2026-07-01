import request from 'supertest';
import { app } from '../../../../index';
import User from '../../../auth/models/User';
import authService from '../../../auth/services/auth.service';
import Divisi from '../../models/Divisi';
import StatusKaryawan from '../../models/StatusKaryawan';
import Employee from '../../models/Employee';
import { Role } from '../../../auth/models/Role';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

describe('Import API Integration (Real DB)', () => {
    let adminToken: string;
    let testUser: User;
    const testFilePath = path.join(__dirname, 'test_import.xlsx');

    beforeAll(async () => {
        try {
            console.log('Import test setup starting...');
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
                nama: 'Admin Import Test',
                nik: '888888',
                password: 'password123',
                role_id: role.id,
                is_active: true
            });

            const userWithRole = await User.findByPk(testUser.id, {
                include: [{ model: Role, as: 'roleDetails' }]
            });
            adminToken = authService.generateToken(userWithRole!);

            // Seed Master Data needed for lookup
            await Divisi.create({ nama: 'Integrated IT' });
            await StatusKaryawan.create({ nama: 'Aktif' });

            // Create a real Excel file for testing
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Data Karyawan');
            sheet.addRow(['No Induk Karyawan', 'Nama Lengkap', 'Email Perusahaan', 'No Handphone', 'Divisi', 'Status Karyawan']);
            sheet.addRow(['IMP-2024-001', 'Imported Test 1', 'imp1@test.com', '08111111', 'Integrated IT', 'Aktif']);
            sheet.addRow(['IMP-2024-002', 'Imported Test 2', 'imp2@test.com', '08222222', 'Integrated IT', 'Aktif']);

            await workbook.xlsx.writeFile(testFilePath);
            console.log('Import test setup completed');
        } catch (error: any) {
            console.error('IMPORT SETUP ERROR:', error.message);
            throw error;
        }
    });

    afterAll(async () => {
        try {
            console.log('Import test cleanup starting...');
            await Employee.destroy({ where: { nomor_induk_karyawan: ['IMP-2024-001', 'IMP-2024-002'] }, force: true });
            await User.destroy({ where: { nik: '888888' } });
            await Divisi.destroy({ where: { nama: 'Integrated IT' } });
            await StatusKaryawan.destroy({ where: { nama: 'Aktif' } });
            if (fs.existsSync(testFilePath)) fs.unlinkSync(testFilePath);
            console.log('Import test cleanup completed');
        } catch (e) {
            console.error('Cleanup error:', e);
        }
    });

    describe('Full Import Flow', () => {
        let uploadedFilePath: string;

        it('should upload and preview Excel file', async () => {
            const res = await request(app)
                .post('/api/hr/import/preview')
                .set('Authorization', `Bearer ${adminToken}`)
                .attach('file', testFilePath);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveProperty('rows');
            expect(res.body.data.rows.length).toBeGreaterThan(0);
            expect(res.body.data).toHaveProperty('filePath');
            uploadedFilePath = res.body.data.filePath;
        });

        it('should process employee import from uploaded file', async () => {
            const res = await request(app)
                .post('/api/hr/import/employees')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ filePath: uploadedFilePath });

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveProperty('success');
            expect(res.body.data.success).toBe(2);
            expect(res.body.data.failed).toBe(0);

            // Verify persistence
            const emp1 = await Employee.findOne({ where: { nomor_induk_karyawan: 'IMP-2024-001' } });
            expect(emp1).not.toBeNull();
            expect(emp1?.nama_lengkap).toBe('Imported Test 1');
        });

        it('should fail with 400 if file not found', async () => {
            const res = await request(app)
                .post('/api/hr/import/employees')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ filePath: 'non-existent-path' });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('File not found or expired. Please upload again.');
        });
    });
});
