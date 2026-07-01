import sequelize from '../config/database';
import { RESOURCES, ACTIONS } from '../shared/constants/permissions';
import { Role } from '../modules/auth/models/Role';
import { Permission } from '../modules/auth/models/Permission';
import '../modules/auth/models/RolePermission';
import User from '../modules/auth/models/User';

async function seedAll() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.\n');

        // ═══════════════════════════════════════════
        // CLEANUP: Hapus semua data kecuali credential
        // ═══════════════════════════════════════════
        console.log('--- Cleanup: Menghapus data non-credential ---');

        await sequelize.query('SET session_replication_role = replica;');

        const tablesToClean = [
            'inv_stok',
            'inv_serial_number',
            'inv_transaksi_detail',
            'inv_transaksi',
            'inv_produk',
            'inv_gudang',
            'inv_brand',
            'inv_sub_kategori',
            'inv_kategori',
            'inv_uom',
            'employee_documents',
            'employee_family_info',
            'employee_hr_info',
            'employee_personal_info',
            'leaves',
            'attendances',
            'employees',
            'posisi_jabatan',
            'department',
            'divisi',
            'kategori_pangkat',
            'golongan',
            'sub_golongan',
            'jenis_hubungan_kerja',
            'tag',
            'lokasi_kerja',
            'status_karyawan',
        ];

        for (const table of tablesToClean) {
            try {
                await sequelize.query(`TRUNCATE TABLE "${table}" CASCADE`);
                console.log(`  Truncated: ${table}`);
            } catch {
                console.log(`  Skipped (not found): ${table}`);
            }
        }

        await sequelize.query(`UPDATE "users" SET "employee_id" = NULL WHERE "employee_id" IS NOT NULL`);
        console.log('  Cleared employee_id references from users');

        await sequelize.query('SET session_replication_role = DEFAULT;');
        console.log('  Cleanup selesai.\n');

        // ═══════════════════════════════════════════
        // LAYER 1: RBAC — Permissions & Roles
        // ═══════════════════════════════════════════
        console.log('--- Layer 1: RBAC ---');

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
        console.log('  Permissions seeded');

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

        const adminRole = await Role.findOne({ where: { name: 'admin' } });
        if (adminRole) {
            const findPerms = (res: string, acts?: string[]) =>
                allPermissions.filter(p => p.resource === res && (!acts || acts.includes(p.action)));
            const adminPerms = [
                ...findPerms(RESOURCES.EMPLOYEES), ...findPerms(RESOURCES.MASTER_DATA),
                ...findPerms(RESOURCES.DOCUMENTS), ...findPerms(RESOURCES.AUDIT_LOGS),
                ...findPerms(RESOURCES.DASHBOARD), ...findPerms(RESOURCES.IMPORT), ...findPerms(RESOURCES.EXPORT),
                ...findPerms(RESOURCES.USERS, [ACTIONS.READ, ACTIONS.UPDATE]),
                ...findPerms(RESOURCES.ROLES, [ACTIONS.READ]),
                ...findPerms(RESOURCES.INVENTORY_MASTER_DATA), ...findPerms(RESOURCES.INVENTORY_STOCK),
            ];
            await adminRole.setPermissions(adminPerms);
        }

        const staffRole = await Role.findOne({ where: { name: 'staff' } });
        if (staffRole) {
            const findPerms = (res: string, acts?: string[]) =>
                allPermissions.filter(p => p.resource === res && (!acts || acts.includes(p.action)));
            const staffPerms = [
                ...findPerms(RESOURCES.EMPLOYEES, [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.VIEW_ALL]),
                ...findPerms(RESOURCES.MASTER_DATA, [ACTIONS.READ]),
                ...findPerms(RESOURCES.DOCUMENTS, [ACTIONS.CREATE, ACTIONS.READ]),
                ...findPerms(RESOURCES.AUDIT_LOGS, [ACTIONS.READ]),
                ...findPerms(RESOURCES.DASHBOARD, [ACTIONS.READ, ACTIONS.VIEW_ALL]),
                ...findPerms(RESOURCES.EXPORT, [ACTIONS.EXPORT]),
            ];
            await staffRole.setPermissions(staffPerms);
        }

        const managerRole = await Role.findOne({ where: { name: 'manager' } });
        if (managerRole) {
            const findPerms = (res: string, acts?: string[]) =>
                allPermissions.filter(p => p.resource === res && (!acts || acts.includes(p.action)));
            const managerPerms = [
                ...findPerms(RESOURCES.EMPLOYEES, [ACTIONS.READ, ACTIONS.VIEW_DEPARTMENT]),
                ...findPerms(RESOURCES.MASTER_DATA, [ACTIONS.READ]),
                ...findPerms(RESOURCES.DASHBOARD, [ACTIONS.READ, ACTIONS.VIEW_DEPARTMENT]),
                ...findPerms(RESOURCES.DOCUMENTS, [ACTIONS.READ]),
            ];
            await managerRole.setPermissions(managerPerms);
        }

        const employeeRole = await Role.findOne({ where: { name: 'employee' } });
        if (employeeRole) {
            const findPerms = (res: string, acts?: string[]) =>
                allPermissions.filter(p => p.resource === res && (!acts || acts.includes(p.action)));
            const employeePerms = [
                ...findPerms(RESOURCES.EMPLOYEES, [ACTIONS.READ]),
                ...findPerms(RESOURCES.MASTER_DATA, [ACTIONS.READ]),
                ...findPerms(RESOURCES.DOCUMENTS, [ACTIONS.READ]),
            ];
            await employeeRole.setPermissions(employeePerms);
        }

        console.log('  Roles seeded & all permissions assigned');

        // ═══════════════════════════════════════════
        // LAYER 2: Users (credential login)
        // ═══════════════════════════════════════════
        console.log('\n--- Layer 2: Users ---');

        if (superadminRole) {
            await User.findOrCreate({ where: { nik: '111111' }, defaults: { nama: 'Superadmin', nik: '111111', password: 'password123', role_id: superadminRole.id, is_active: true } as any });
            await User.findOrCreate({ where: { nik: '1234567890123456' }, defaults: { nama: 'Superadmin Full', nik: '1234567890123456', password: 'password123', role_id: superadminRole.id, is_active: true } as any });
        }
        console.log('  Users: 2 (superadmin)');

        // ═══════════════════════════════════════════
        console.log('\n=== Seed completed successfully! ===');
        console.log('Login: NIK 1234567890123456 / password123');
        console.log('Login: NIK 111111 / password123');
        process.exit(0);
    } catch (error) {
        console.error('\nSeed failed:', error);
        process.exit(1);
    }
}

seedAll();
