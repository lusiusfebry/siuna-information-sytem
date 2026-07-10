import { Migration } from '../umzug';

// RT-4 fix: the RBAC seed originally omitted Inventory and Facility permission
// rows, so those permissions never existed in the `permissions` table. As a
// result no non-superadmin role could ever be granted Inventory/Facility access
// (checkPermission always denied; only the superadmin bypass worked).
//
// This migration is idempotent — it inserts any missing (resource, action) rows
// for the four module resources and re-grants the full permission set to the
// superadmin role. Safe to run on an existing DB.

const RESOURCES = [
    'inventory_master_data',
    'inventory_stock',
    'facility_master_data',
    'facility_work_order',
];
const ACTIONS = ['create', 'read', 'update', 'delete'];

export const up: Migration = async ({ context: queryInterface }) => {
    const sequelize = queryInterface.sequelize;

    // 1. Insert missing permission rows (idempotent).
    for (const resource of RESOURCES) {
        for (const action of ACTIONS) {
            await sequelize.query(
                `INSERT INTO permissions (resource, action, created_at, updated_at)
                 SELECT :resource, :action, NOW(), NOW()
                 WHERE NOT EXISTS (
                     SELECT 1 FROM permissions WHERE resource = :resource AND action = :action
                 )`,
                { replacements: { resource, action } }
            );
        }
    }

    // 2. Re-grant ALL permissions to the superadmin role (idempotent).
    await sequelize.query(
        `INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
         SELECT r.id, p.id, NOW(), NOW()
         FROM roles r CROSS JOIN permissions p
         WHERE r.name = 'superadmin'
           AND NOT EXISTS (
               SELECT 1 FROM role_permissions rp
               WHERE rp.role_id = r.id AND rp.permission_id = p.id
           )`
    );
};

export const down: Migration = async ({ context: queryInterface }) => {
    const sequelize = queryInterface.sequelize;
    // Remove the module permission rows added here (role_permissions rows are
    // cascade-removed by FK, or become orphaned grants that are harmless).
    for (const resource of RESOURCES) {
        await sequelize.query(
            `DELETE FROM permissions WHERE resource = :resource AND action IN (:actions)`,
            { replacements: { resource, actions: ACTIONS } }
        );
    }
};
