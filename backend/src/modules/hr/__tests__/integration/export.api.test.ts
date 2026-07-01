import request from 'supertest';
import { app } from '../../../../index';
import User from '../../../auth/models/User';
import authService from '../../../auth/services/auth.service';
import Employee from '../../models/Employee';
import { Role } from '../../../auth/models/Role';
import Divisi from '../../models/Divisi';
import StatusKaryawan from '../../models/StatusKaryawan';

describe('Export API Integration (Real DB)', () => {
    let adminToken: string;
    let testUser: User;
    let testEmployeeId: number;

    beforeAll(async () => {
        try {
            console.log('Export test setup starting...');
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
                nama: 'Admin Export Test',
                nik: '999999',
                password: 'password123',
                role_id: role.id,
                is_active: true
            });

            const userWithRole = await User.findByPk(testUser.id, {
                include: [{ model: Role, as: 'roleDetails' }]
            });
            adminToken = authService.generateToken(userWithRole!);

            // Create a test employee
            const divisi = await Divisi.create({ nama: 'Export Div' });
            const status = await StatusKaryawan.create({ nama: 'Aktif Export' });

            const employee = await Employee.create({
                nama_lengkap: 'Export Test Employee',
                nomor_induk_karyawan: 'EXP-001',
                divisi_id: divisi.id,
                status_karyawan_id: status.id,
                email_perusahaan: 'export@test.com'
            });
            testEmployeeId = employee.id;

            console.log('Export test setup completed');
        } catch (error: any) {
            console.error('EXPORT SETUP ERROR:', error.message);
            throw error;
        }
    });

    afterAll(async () => {
        try {
            console.log('Export test cleanup starting...');
            // We use force: true to bypass any soft delete logic if present
            await Employee.destroy({ where: { id: testEmployeeId }, force: true });
            await User.destroy({ where: { nik: '999999' } });
            await Divisi.destroy({ where: { nama: 'Export Div' } });
            await StatusKaryawan.destroy({ where: { nama: 'Aktif Export' } });
            console.log('Export test cleanup completed');
        } catch (e) {
            console.error('Cleanup error:', e);
        }
    });

    describe('GET /api/hr/employees/export/excel', () => {
        it('should export employees list to excel', async () => {
            const res = await request(app)
                .get('/api/hr/employees/export/excel')
                .set('Authorization', `Bearer ${adminToken}`)
                .buffer()
                .parse((res, cb) => {
                    let data = Buffer.from('');
                    res.on('data', (chunk) => {
                        data = Buffer.concat([data, chunk]);
                    });
                    res.on('end', () => {
                        cb(null, data);
                    });
                });

            expect(res.status).toBe(200);
            expect(res.header['content-type']).toContain('spreadsheetml');
            expect(res.body).toBeDefined();
            expect(Buffer.isBuffer(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
        });
    });

    describe('GET /api/hr/employees/:id/export/pdf', () => {
        it('should export individual employee to pdf', async () => {
            // PDF generation might be slow due to Puppeteer
            const res = await request(app)
                .get(`/api/hr/employees/${testEmployeeId}/export/pdf`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            // Puppeteer might return application/pdf
            expect(res.header['content-type']).toBe('application/pdf');
            expect(res.body).toBeInstanceOf(Buffer);
            expect(res.body.length).toBeGreaterThan(0);
        }, 30000); // Higher timeout for PDF
    });
});
