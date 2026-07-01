import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../../config/env';
import User from '../models/User';
import Employee from '../../hr/models/Employee';

import { Role } from '../models/Role';

class AuthService {
    async login(nik: string, password: string) {
        const user = await User.findOne({
            where: { nik },
            include: [
                { model: Employee, as: 'employee' },
                { model: Role, as: 'roleDetails' }
            ]
        });

        if (!user) {
            throw new Error('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }

        // Update last login
        user.last_login = new Date();
        await user.save();

        const token = this.generateToken(user);

        return { user, token };
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
