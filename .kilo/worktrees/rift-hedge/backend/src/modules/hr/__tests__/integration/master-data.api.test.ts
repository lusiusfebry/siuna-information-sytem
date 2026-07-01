import request from 'supertest';
import { app } from '../../../../index';
import User from '../../../auth/models/User';
import authService from '../../../auth/services/auth.service';
import Divisi from '../../models/Divisi';
import Department from '../../models/Department';
import { Role } from '../../../auth/models/Role';

describe('Master Data API Integration', () => {
    let token: string;
    let testUser: User;
    let testDivisi: Divisi;
    let testDept: Department;
    let superadminRole: Role;

    beforeAll(async () => {
        try {
            console.log('Master data test setup starting...');
            // Find or create Superadmin role
            const [role] = await Role.findOrCreate({
                where: { name: 'superadmin' },
                defaults: {
                    name: 'superadmin',
                    display_name: 'Superadmin',
                    is_system_role: true
                }
            });
            superadminRole = role;
            console.log('Role superadmin found/created');

            // Create test user for auth
            testUser = await User.create({
                nama: 'Master Data Test User',
                nik: '888888',
                password: 'password123',
                role_id: superadminRole.id,
                is_active: true
            });
            console.log('Test user created');

            // Re-fetch user to include roleDetails for generateToken
            const userWithRole = await User.findByPk(testUser.id, {
                include: [{ model: Role, as: 'roleDetails' }]
            });

            token = authService.generateToken(userWithRole!);
            console.log('Token generated');

            // Seed some data
            testDivisi = await Divisi.create({ nama: 'Test Divisi' });
            console.log('Test divisi created');
            testDept = await Department.create({
                nama: 'Test Dept',
                divisi_id: testDivisi.id
            });
            console.log('Test dept created');
        } catch (error: any) {
            console.error('BEFORE ALL ERROR:', error.message);
            if (error.errors) console.error('VALIDATION:', error.errors.map((e: any) => e.message));
            throw error;
        }
    });

    afterAll(async () => {
        try {
            console.log('Master data test cleanup starting...');
            if (testUser) await User.destroy({ where: { nik: '888888' } });
            if (testDept) await Department.destroy({ where: { id: testDept.id } });
            if (testDivisi) await Divisi.destroy({ where: { id: testDivisi.id } });
            console.log('Master data test cleanup completed');
        } catch (e) {
            console.error('Cleanup error:', e);
        }
    });

    describe('GET /api/hr/master/:model', () => {
        it('should return list of master data', async () => {
            const res = await request(app)
                .get('/api/hr/master/department')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data).toBeInstanceOf(Array);
            expect(res.body.data.length).toBeGreaterThan(0);
        });
    });

    describe('POST /api/hr/master/:model', () => {
        it('should create master data', async () => {
            const res = await request(app)
                .post('/api/hr/master/divisi')
                .set('Authorization', `Bearer ${token}`)
                .send({ nama: 'New Divisi' });

            expect(res.status).toBe(201);
            expect(res.body.status).toBe('success');
            expect(res.body.data.nama).toBe('New Divisi');

            // Clean up
            await Divisi.destroy({ where: { id: res.body.data.id } });
        });
    });

    describe('PUT /api/hr/master/:model/:id', () => {
        it('should update master data', async () => {
            const res = await request(app)
                .put(`/api/hr/master/divisi/${testDivisi.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ nama: 'Updated Divisi' });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data.nama).toBe('Updated Divisi');
        });
    });

    describe('DELETE /api/hr/master/:model/:id', () => {
        it('should delete master data', async () => {
            const newDiv = await Divisi.create({ nama: 'To Be Deleted' });
            const res = await request(app)
                .delete(`/api/hr/master/divisi/${newDiv.id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
        });
    });
});
