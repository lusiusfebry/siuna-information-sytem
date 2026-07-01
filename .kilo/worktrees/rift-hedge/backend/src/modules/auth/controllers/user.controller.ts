import { Request, Response } from 'express';
import User from '../models/User';
import { Role } from '../models/Role';
import Employee from '../../hr/models/Employee';

class UserController {
    public async getAllUsers(req: Request, res: Response) {
        try {
            const users = await User.findAll({
                attributes: ['id', 'nik', 'employee_id', 'role_id', 'is_active', 'last_login'],
                include: [
                    {
                        model: Role,
                        as: 'roleDetails',
                        attributes: ['id', 'name', 'display_name']
                    },
                    {
                        model: Employee,
                        as: 'employee',
                        attributes: ['id', 'nama_lengkap', 'email_perusahaan']
                    }
                ],
                order: [['created_at', 'DESC']]
            });
            res.json({ data: users });
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch users', error });
        }
    }

    public async updateUserRole(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { role_id } = req.body;

            const user = await User.findByPk(id);
            if (!user) return res.status(404).json({ message: 'User not found' });

            const role = await Role.findByPk(role_id);
            if (!role) return res.status(400).json({ message: 'Role invalid' });

            // Prevent changing own role if not safely handled? Or strictly superadmin.
            const currentUser = req.user;
            if (currentUser && currentUser.id === user.id && currentUser.roleDetails?.name !== 'superadmin') {
                // Self-demotion check? Allow for now if authorized.
            }

            await user.update({ role_id });
            res.json({ message: 'User role updated' });
        } catch (error) {
            res.status(500).json({ message: 'Failed to update user role', error });
        }
    }

    public async toggleUserStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { is_active } = req.body;

            const user = await User.findByPk(id);
            if (!user) return res.status(404).json({ message: 'User not found' });

            if (user.id === req.user?.id) {
                return res.status(400).json({ message: 'Cannot deactivate yourself' });
            }

            await user.update({ is_active });
            res.json({ message: `User ${is_active ? 'activated' : 'deactivated'}` });
        } catch (error) {
            res.status(500).json({ message: 'Failed to update user status', error });
        }
    }
}

export default new UserController();
