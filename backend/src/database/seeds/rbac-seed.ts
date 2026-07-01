import { Role } from '../../modules/auth/models/Role';
import { Permission } from '../../modules/auth/models/Permission';
import { RESOURCES, ACTIONS } from '../../shared/constants/permissions';

const seedRBAC = async () => {
    console.log('Seeding RBAC...');

    // 1. Seed Permissions
    const permissionsData = [
        // Employees
        { resource: RESOURCES.EMPLOYEES, action: ACTIONS.CREATE },
        { resource: RESOURCES.EMPLOYEES, action: ACTIONS.READ },
        { resource: RESOURCES.EMPLOYEES, action: ACTIONS.UPDATE },
        { resource: RESOURCES.EMPLOYEES, action: ACTIONS.DELETE },
        { resource: RESOURCES.EMPLOYEES, action: ACTIONS.VIEW_ALL },
        { resource: RESOURCES.EMPLOYEES, action: ACTIONS.VIEW_DEPARTMENT },

        // Master Data
        { resource: RESOURCES.MASTER_DATA, action: ACTIONS.CREATE },
        { resource: RESOURCES.MASTER_DATA, action: ACTIONS.READ },
        { resource: RESOURCES.MASTER_DATA, action: ACTIONS.UPDATE },
        { resource: RESOURCES.MASTER_DATA, action: ACTIONS.DELETE },

        // Documents
        { resource: RESOURCES.DOCUMENTS, action: ACTIONS.CREATE },
        { resource: RESOURCES.DOCUMENTS, action: ACTIONS.READ },
        { resource: RESOURCES.DOCUMENTS, action: ACTIONS.DELETE },

        // Audit Logs
        { resource: RESOURCES.AUDIT_LOGS, action: ACTIONS.READ },

        // Dashboard
        { resource: RESOURCES.DASHBOARD, action: ACTIONS.READ },
        { resource: RESOURCES.DASHBOARD, action: ACTIONS.VIEW_ALL },
        { resource: RESOURCES.DASHBOARD, action: ACTIONS.VIEW_DEPARTMENT },

        // Import/Export
        { resource: RESOURCES.IMPORT, action: ACTIONS.IMPORT },
        { resource: RESOURCES.EXPORT, action: ACTIONS.EXPORT },

        // Roles & Users (Admin/Superadmin only generally)
        { resource: RESOURCES.ROLES, action: ACTIONS.CREATE },
        { resource: RESOURCES.ROLES, action: ACTIONS.READ },
        { resource: RESOURCES.ROLES, action: ACTIONS.UPDATE },
        { resource: RESOURCES.ROLES, action: ACTIONS.DELETE },
        { resource: RESOURCES.USERS, action: ACTIONS.CREATE },
        { resource: RESOURCES.USERS, action: ACTIONS.READ },
        { resource: RESOURCES.USERS, action: ACTIONS.UPDATE },
        { resource: RESOURCES.USERS, action: ACTIONS.DELETE },
    ];

    // Upsert Permissions
    // We can't use bulkCreate with updateOnDuplicate easily for all dialects specifically with unique compound key
    // Iterate for safety in seed
    for (const p of permissionsData) {
        await Permission.findOrCreate({
            where: { resource: p.resource, action: p.action },
            defaults: p
        });
    }

    const allPermissions = await Permission.findAll();
    const findPerms = (res: string, actions?: string[]) => {
        return allPermissions.filter(p => p.resource === res && (!actions || actions.includes(p.action)));
    };

    // 2. Seed Roles
    const rolesData = [
        { name: 'superadmin', display_name: 'Super Administrator', is_system_role: true },
        { name: 'admin', display_name: 'HR Admin', is_system_role: true },
        { name: 'staff', display_name: 'HR Staff', is_system_role: true },
        { name: 'manager', display_name: 'Manager', is_system_role: true },
        { name: 'employee', display_name: 'Employee', is_system_role: true },
    ];

    for (const r of rolesData) {
        await Role.findOrCreate({
            where: { name: r.name },
            defaults: r
        });
    }

    const roles = await Role.findAll();
    const getRole = (name: string) => roles.find(r => r.name === name);

    // 3. Assign Permissions

    // Superadmin: ALL
    const superadmin = getRole('superadmin');
    if (superadmin) {
        await superadmin.setPermissions(allPermissions);
    }

    // HR Admin: Employees (All), Master Data (All), Docs (All), Audit (Read), Dashboard (All), Import, Export, Users (Read/Update)
    const admin = getRole('admin');
    if (admin) {
        const adminPerms = [
            ...findPerms(RESOURCES.EMPLOYEES),
            ...findPerms(RESOURCES.MASTER_DATA),
            ...findPerms(RESOURCES.DOCUMENTS),
            ...findPerms(RESOURCES.AUDIT_LOGS),
            ...findPerms(RESOURCES.DASHBOARD),
            ...findPerms(RESOURCES.IMPORT),
            ...findPerms(RESOURCES.EXPORT),
            ...findPerms(RESOURCES.USERS, [ACTIONS.READ, ACTIONS.UPDATE]), // Manage users but maybe not roles?
            ...findPerms(RESOURCES.ROLES, [ACTIONS.READ]),
        ];
        await admin.setPermissions(adminPerms);
    }

    // HR Staff: Employees (Create, Read, Update, ViewAll), Master Data (Read), Docs (Create, Read), Audit (Read), Dashboard (Read)
    const staff = getRole('staff');
    if (staff) {
        const staffPerms = [
            ...findPerms(RESOURCES.EMPLOYEES, [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.VIEW_ALL]),
            ...findPerms(RESOURCES.MASTER_DATA, [ACTIONS.READ]),
            ...findPerms(RESOURCES.DOCUMENTS, [ACTIONS.CREATE, ACTIONS.READ]), // Can upload
            ...findPerms(RESOURCES.AUDIT_LOGS, [ACTIONS.READ]),
            ...findPerms(RESOURCES.DASHBOARD, [ACTIONS.READ, ACTIONS.VIEW_ALL]), // View Dashboard
            ...findPerms(RESOURCES.EXPORT), // Can export?
        ];
        await staff.setPermissions(staffPerms);
    }

    // Manager: Employees (Read, ViewDept), Master Data (Read), Dashboard (Read, ViewDept)
    const manager = getRole('manager');
    if (manager) {
        const managerPerms = [
            ...findPerms(RESOURCES.EMPLOYEES, [ACTIONS.READ, ACTIONS.VIEW_DEPARTMENT]),
            ...findPerms(RESOURCES.MASTER_DATA, [ACTIONS.READ]),
            ...findPerms(RESOURCES.DASHBOARD, [ACTIONS.READ, ACTIONS.VIEW_DEPARTMENT]),
            ...findPerms(RESOURCES.DOCUMENTS, [ACTIONS.READ]), // Read docs of employees
        ];
        await manager.setPermissions(managerPerms);
    }

    // Employee: Employees (Read own), Master Data (Read)
    const employee = getRole('employee');
    if (employee) {
        const employeePerms = [
            ...findPerms(RESOURCES.EMPLOYEES, [ACTIONS.READ]), // Middleware restricts to self
            ...findPerms(RESOURCES.MASTER_DATA, [ACTIONS.READ]),
            ...findPerms(RESOURCES.DOCUMENTS, [ACTIONS.READ]),
        ];
        await employee.setPermissions(employeePerms);
    }

    // 4. Update Existing Users to foreign key (If not handled by migration)
    // Migration handles basic mapping 'admin' -> admin role id
    // But if we have new users or clean DB, this ensures validity.
    // We already moved to role_id in migration, so this step assumes data is correct or migration handled it.

    console.log('RBAC Seeding Completed.');
};

export default seedRBAC;
