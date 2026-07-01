import { Permission } from '../models/Permission';
import { Role } from '../models/Role';
// import { RolePermission } from '../models/RolePermission';
import User from '../models/User';
import Employee from '../../hr/models/Employee';

class PermissionService {
    // Cache for permission checks (in-memory for simplicity, can use Redis)
    // Map<userId, Permission[]>
    private requestCache = new Map<number, Permission[]>();

    public async getUserPermissions(userId: number): Promise<Permission[]> {
        // Implement rudimentary caching per request via middleware usually, 
        // but here we just fetch from DB.
        const user = await User.findByPk(userId, {
            include: [{
                model: Role,
                as: 'roleDetails',
                include: [{
                    model: Permission,
                    as: 'permissions',
                    through: { attributes: [] }
                }]
            }]
        });

        if (!user || !user.roleDetails || !user.roleDetails.getPermissions) {
            return [];
        }

        // Sequelize ManyToMany returns permissions in role.permissions (if aliased) or getPermissions()
        // With 'as: permissions' in includes, it should be populated
        // @ts-ignore - dynamic property
        return user.roleDetails.permissions || [];
    }

    public async hasPermission(userId: number, resource: string, action: string): Promise<boolean> {
        const user = await User.findByPk(userId, {
            include: [{ model: Role, as: 'roleDetails' }]
        });

        // Superadmin bypass
        if (user?.roleDetails?.name === 'superadmin') {
            return true;
        }

        const permissions = await this.getUserPermissions(userId);
        return permissions.some(p => p.resource === resource && p.action === action);
    }

    public async canAccessEmployee(userId: number, targetEmployeeId: number): Promise<boolean> {
        const user = await User.findByPk(userId, {
            include: [{ model: Employee, as: 'employee' }, { model: Role, as: 'roleDetails' }]
        });

        if (!user) return false;

        // Superadmin and HR Admin can access everyone (checked via hasPermission usually, but here specific logic)
        // We assume valid permission check is done BEFORE calling this for general access.
        // This function refines access for specific roles like Manager/Employee

        if (user.roleDetails?.name === 'superadmin' || user.roleDetails?.name === 'admin' || user.roleDetails?.name === 'staff') {
            return true;
        }

        if (user.roleDetails?.name === 'manager') {
            // Manager can access employees in their department
            if (!user.employee) return false;
            const target = await Employee.findByPk(targetEmployeeId);
            if (!target) return false;

            // Allow if in same department
            // Note: Use department_id for simple check.
            // For hierarchical, we might need more complex logic.
            // Assumption: Director/Head also has 'manager' role or better 'admin' role?
            // If strictly department based:
            return user.employee.department_id === target.department_id;
        }

        if (user.roleDetails?.name === 'employee') {
            // Can only access own profile
            return user.employee_id === targetEmployeeId;
        }

        return false;
    }
}

export const permissionService = new PermissionService();
