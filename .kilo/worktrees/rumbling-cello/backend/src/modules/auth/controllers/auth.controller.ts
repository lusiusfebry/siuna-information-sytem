import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import User from '../models/User';
import { Role } from '../models/Role';
import Employee from '../../hr/models/Employee';

class AuthController {
    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { nik, password } = req.body;

            if (!nik || !password) {
                return res.status(400).json({ message: 'NIK and password are required' });
            }

            const { user, token } = await authService.login(nik, password);

            const fullUser = await User.findByPk(user.id, {
                include: [
                    { model: Employee, as: 'employee' },
                    { model: Role, as: 'roleDetails', include: ['permissions'] }
                ]
            });

            if (!fullUser) {
                return res.status(401).json({ message: 'User retrieval failed' });
            }

            res.json({
                status: 'success',
                data: {
                    user: {
                        id: fullUser.id,
                        nik: fullUser.nik,
                        roleDetails: fullUser.roleDetails, // Use roleDetails, not role
                        employee: fullUser.employee
                    },
                    token
                }
            });
        } catch (error: any) {
            if (error.message === 'Invalid credentials') {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            next(error);
        }
    }

    async me(req: Request, res: Response, next: NextFunction) {
        try {
            const decodedUser = (req as any).user;

            if (!decodedUser || !decodedUser.id) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const fullUser = await User.findByPk(decodedUser.id, {
                include: [
                    { model: Employee, as: 'employee' },
                    { model: Role, as: 'roleDetails', include: ['permissions'] }
                ]
            });

            if (!fullUser) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.json({
                status: 'success',
                data: {
                    user: {
                        id: fullUser.id,
                        nik: fullUser.nik,
                        roleDetails: fullUser.roleDetails,
                        employee: fullUser.employee
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async logout(req: Request, res: Response, next: NextFunction) {
        try {
            res.json({ status: 'success', message: 'Logged out successfully' });
        } catch (error) {
            next(error);
        }
    }
}

export default new AuthController();
