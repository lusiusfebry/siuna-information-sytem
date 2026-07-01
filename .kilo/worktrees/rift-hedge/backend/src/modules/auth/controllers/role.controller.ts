import { Request, Response } from 'express';
import { Role } from '../models/Role';
import { Permission } from '../models/Permission';
// import { RolePermission } from '../models/RolePermission';
import User from '../models/User';

class RoleController {
    public async getAllRoles(req: Request, res: Response) {
        try {
            const roles = await Role.findAll({
                include: [{
                    model: Permission,
                    as: 'permissions',
                    through: { attributes: [] }
                }],
                order: [['name', 'ASC']]
            });
            res.json({ data: roles });
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch roles', error });
        }
    }

    public async getRoleById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const role = await Role.findByPk(id, {
                include: [{
                    model: Permission,
                    as: 'permissions',
                    through: { attributes: [] }
                }]
            });
            if (!role) return res.status(404).json({ message: 'Role not found' });
            res.json({ data: role });
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch role', error });
        }
    }

    public async createRole(req: Request, res: Response) {
        try {
            const { name, display_name, description, permission_ids } = req.body;

            // Check existing
            const existing = await Role.findOne({ where: { name } });
            if (existing) return res.status(400).json({ message: 'Role name already exists' });

            const role = await Role.create({
                name,
                display_name,
                description,
                is_system_role: false
            });

            if (permission_ids && Array.isArray(permission_ids)) {
                await role.setPermissions(permission_ids); // Sequelize mixin
            }

            const roleWithPermissions = await Role.findByPk(role.id, {
                include: [{ model: Permission, as: 'permissions' }]
            });

            res.status(201).json({ message: 'Role created', data: roleWithPermissions });
        } catch (error) {
            res.status(500).json({ message: 'Failed to create role', error });
        }
    }

    public async updateRole(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { display_name, description, permission_ids } = req.body;

            const role = await Role.findByPk(id);
            if (!role) return res.status(404).json({ message: 'Role not found' });

            // Don't update name of system roles usually, or any role to prevent unique errors easily
            await role.update({ display_name, description });

            if (permission_ids && Array.isArray(permission_ids)) {
                await role.setPermissions(permission_ids);
            }

            // Fetch updated
            const updatedRole = await Role.findByPk(id, {
                include: [{ model: Permission, as: 'permissions' }]
            });

            res.json({ message: 'Role updated', data: updatedRole });
        } catch (error) {
            res.status(500).json({ message: 'Failed to update role', error });
        }
    }

    public async deleteRole(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const role = await Role.findByPk(id);

            if (!role) return res.status(404).json({ message: 'Role not found' });
            if (role.is_system_role) {
                return res.status(400).json({ message: 'Cannot delete system role' });
            }

            // Check usage
            const userCount = await User.count({ where: { role_id: id } });
            if (userCount > 0) {
                return res.status(400).json({ message: 'Cannot delete role assigned to users' });
            }

            await role.destroy();
            res.json({ message: 'Role deleted' });
        } catch (error) {
            res.status(500).json({ message: 'Failed to delete role', error });
        }
    }

    public async getPermissions(req: Request, res: Response) {
        try {
            const permissions = await Permission.findAll({
                order: [['resource', 'ASC'], ['action', 'ASC']]
            });
            res.json({ data: permissions });
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch permissions', error });
        }
    }
}

export default new RoleController();
