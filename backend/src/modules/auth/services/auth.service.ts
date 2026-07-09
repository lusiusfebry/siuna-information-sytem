import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../../config/env';
import User from '../models/User';
import Employee from '../../hr/models/Employee';

import { Role } from '../models/Role';

// Per-account brute-force lockout (in-memory). After MAX_ATTEMPTS failed logins
// within the window, the account is locked for LOCK_MS. Successful login clears
// the counter. Enforcement is skipped in development so local testing is never
// blocked (a single-instance store is fine for now; move to Redis for multi-node).
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000; // 15 minutes
const failedAttempts = new Map<string, { count: number; lockedUntil: number }>();

class AuthService {
    async login(nik: string, password: string) {
        const enforceLockout = process.env.NODE_ENV !== 'development';
        const record = failedAttempts.get(nik);

        if (enforceLockout && record && record.lockedUntil > Date.now()) {
            const mins = Math.ceil((record.lockedUntil - Date.now()) / 60000);
            throw new Error(`Akun terkunci sementara karena terlalu banyak percobaan gagal. Coba lagi dalam ${mins} menit.`);
        }

        const user = await User.findOne({
            where: { nik },
            include: [
                { model: Employee, as: 'employee' },
                { model: Role, as: 'roleDetails' }
            ]
        });

        if (!user) {
            this.registerFailedAttempt(nik);
            throw new Error('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            this.registerFailedAttempt(nik);
            throw new Error('Invalid credentials');
        }

        // Block deactivated accounts at the door.
        if ((user as any).is_active === false) {
            throw new Error('Akun dinonaktifkan');
        }

        // Success — clear any failed-attempt record.
        failedAttempts.delete(nik);

        // Update last login
        user.last_login = new Date();
        await user.save();

        const token = this.generateToken(user);

        return { user, token };
    }

    private registerFailedAttempt(nik: string) {
        const now = Date.now();
        const record = failedAttempts.get(nik);
        if (!record || record.lockedUntil <= now) {
            failedAttempts.set(nik, { count: 1, lockedUntil: 0 });
            return;
        }
        record.count += 1;
        if (record.count >= MAX_ATTEMPTS) {
            record.lockedUntil = now + LOCK_MS;
            record.count = 0;
        }
    }

    generateToken(user: User) {
        return jwt.sign(
            {
                id: user.id,
                nik: user.nik,
                role: user.roleDetails?.name,
                employee_id: user.employee_id
            },
            env.jwtSecret,
            { expiresIn: '24h' }
        );
    }

    verifyToken(token: string) {
        return jwt.verify(token, env.jwtSecret);
    }
}

export default new AuthService();
