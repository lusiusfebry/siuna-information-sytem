import sequelize from '../config/database';
import { RESOURCES, ACTIONS } from '../shared/constants/permissions';
import { Role } from '../modules/auth/models/Role';
import { Permission } from '../modules/auth/models/Permission';
import '../modules/auth/models/RolePermission'; // Register belongsToMany associations
import User from '../modules/auth/models/User';

const seed = async () => {
    try {
        await sequelize.authenticate();

        const permissionsData = [
            { resource: RESOURCES.EMPLOYEES, action: ACTIONS.CREATE },
            { resource: RESOURCES.EMPLOYEES, action: ACTIONS.READ },
            { resource: RESOURCES.EMPLOYEES, action: ACTIONS.UPDATE },
            { resource: RESOURCES.EMPLOYEES, action: ACTIONS.DELETE },
            { resource: RESOURCES.EMPLOYEES, action: ACTIONS.VIEW_ALL },
            { resource: RESOURCES.EMPLOYEES, action: ACTIONS.VIEW_DEPARTMENT },
            { resource: RESOURCES.MASTER_DATA, action: ACTIONS.CREATE },
            { resource: RESOURCES.MASTER_DATA, action: ACTIONS.READ },
            { resource: RESOURCES.MASTER_DATA, action: ACTIONS.UPDATE },
            { resource: RESOURCES.MASTER_DATA, action: ACTIONS.DELETE },
            { resource: RESOURCES.DOCUMENTS, action: ACTIONS.CREATE },
            { resource: RESOURCES.DOCUMENTS, action: ACTIONS.READ },
            { resource: RESOURCES.DOCUMENTS, action: ACTIONS.DELETE },
            { resource: RESOURCES.AUDIT_LOGS, action: ACTIONS.READ },
            { resource: RESOURCES.DASHBOARD, action: ACTIONS.READ },
            { resource: RESOURCES.DASHBOARD, action: ACTIONS.VIEW_ALL },
            { resource: RESOURCES.DASHBOARD, action: ACTIONS.VIEW_DEPARTMENT },
            { resource: RESOURCES.IMPORT, action: ACTIONS.IMPORT },
            { resource: RESOURCES.EXPORT, action: ACTIONS.EXPORT },
            { resource: RESOURCES.ROLES, action: ACTIONS.CREATE },
            { resource: RESOURCES.ROLES, action: ACTIONS.READ },
            { resource: RESOURCES.ROLES, action: ACTIONS.UPDATE },
            { resource: RESOURCES.ROLES, action: ACTIONS.DELETE },
            { resource: RESOURCES.USERS, action: ACTIONS.CREATE },
            { resource: RESOURCES.USERS, action: ACTIONS.READ },
            { resource: RESOURCES.USERS, action: ACTIONS.UPDATE },
            { resource: RESOURCES.USERS, action: ACTIONS.DELETE },
            { resource: RESOURCES.INVENTORY_MASTER_DATA, action: ACTIONS.CREATE },
            { resource: RESOURCES.INVENTORY_MASTER_DATA, action: ACTIONS.READ },
            { resource: RESOURCES.INVENTORY_MASTER_DATA, action: ACTIONS.UPDATE },
            { resource: RESOURCES.INVENTORY_MASTER_DATA, action: ACTIONS.DELETE },
            { resource: RESOURCES.INVENTORY_STOCK, action: ACTIONS.CREATE },
            { resource: RESOURCES.INVENTORY_STOCK, action: ACTIONS.READ },
            { resource: RESOURCES.INVENTORY_STOCK, action: ACTIONS.UPDATE },
            { resource: RESOURCES.INVENTORY_STOCK, action: ACTIONS.DELETE },
        ];

        for (const p of permissionsData) {
            await Permission.findOrCreate({ where: { resource: p.resource, action: p.action }, defaults: p });
        }

        const rolesData = [
            { name: 'superadmin', display_name: 'Super Administrator', is_system_role: true },
            { name: 'admin', display_name: 'HR Admin', is_system_role: true },
            { name: 'staff', display_name: 'HR Staff', is_system_role: true },
            { name: 'manager', display_name: 'Manager', is_system_role: true },
            { name: 'employee', display_name: 'Employee', is_system_role: true },
        ];
        for (const r of rolesData) {
            await Role.findOrCreate({ where: { name: r.name }, defaults: r });
        }

        const allPermissions = await Permission.findAll();
        const superadminRole = await Role.findOne({ where: { name: 'superadmin' } });
        if (superadminRole) await superadminRole.setPermissions(allPermissions);

        if (superadminRole) {
            await User.findOrCreate({ where: { nik: '111111' }, defaults: { nama: 'Superadmin', nik: '111111', password: 'password123', role_id: superadminRole.id, is_active: true } as any });
            await User.findOrCreate({ where: { nik: '1234567890123456' }, defaults: { nama: 'Superadmin Full', nik: '1234567890123456', password: 'password123', role_id: superadminRole.id, is_active: true } as any });
        }

        console.log('Seed data created successfully');
        console.log('Login: NIK 1234567890123456 / password123');
        console.log('Login: NIK 111111 / password123');
    } catch (error) {
        console.error('Error creating seed data:', error);
    }
};

if (require.main === module) {
    seed().then(() => {
        console.log('Done');
        process.exit(0);
    });
}

export default seed;
