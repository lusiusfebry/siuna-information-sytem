import request from 'supertest';
import { app } from '../../../../index'; // Ensure app is exported from index.ts or create a test server setup
import sequelize from '../../../../config/database';
import User from '../../models/User';

describe('Auth API Integration', () => {
    let testUser: any;
    const testPassword = 'password123';

    beforeAll(async () => {
        // Ensure DB connection
        await sequelize.authenticate();

        // Cleanup potential stale data
        await User.destroy({ where: { nik: '999999' } });

        try {
            // Seed Test User - Use plain password as User model hook handles hashing
            testUser = await User.create({
                nama: 'Test User Integration',
                nik: '999999',
                password: testPassword,
                role_id: null,
                is_active: true
            });
            console.log('Test user created:', testUser.id);
        } catch (error: any) {
            console.error('Failed to create test user:', error.message);
            if (error.errors) {
                console.error('Validation errors:', error.errors.map((e: any) => e.message));
            }
            throw error;
        }
    });

    afterAll(async () => {
        // Cleanup
        if (testUser) {
            await User.destroy({ where: { id: testUser.id } });
        }
        await sequelize.close();
    });

    describe('POST /api/auth/login', () => {
        it('should login successfully with valid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    nik: testUser.nik,
                    password: testPassword
                });

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveProperty('token');
            expect(res.body.data.user).toHaveProperty('nik', testUser.nik);
        });

        it('should reject login with invalid password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    nik: testUser.nik,
                    password: 'wrongpassword'
                });

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('message', 'Invalid credentials');
        });

        it('should reject login with non-existent user', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    nik: '000000',
                    password: 'password'
                });

            expect(res.status).toBe(401); // Controller returns 401 for 'Invalid credentials' which covers not found
        });

        it('should reject invalid input format', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    nik: '',
                    password: ''
                });

            expect(res.status).toBe(400);
        });
    });
});
