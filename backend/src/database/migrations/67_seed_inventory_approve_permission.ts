import { Migration } from '../umzug';

// INV-N07: add the 'approve' action for inventory_stock so a role can be granted
// the authority to approve/reject Pending transactions independently of create/read.
// Idempotent: inserts the permission row only if missing and re-grants it to the
// superadmin role. Mirrors the pattern in 57_seed_module_permissions.

const RESOURCE = 'inventory_stock';
const ACTION = 'approve';

export const up: Migration = async ({ context: queryInterface }) => {
    const sequelize = queryInterface.sequelize;

    await sequelize.query(
        `INSERT INTO permissions (resource, action, created_at, updated_at)
         SELECT :resource, :action, NOW(), NOW()
         WHERE NOT EXISTS (
             SELECT 1 FROM permissions WHERE resource = :resource AND action = :action
         )`,
        { replacements: { resource: RESOURCE, action: ACTION } }
    );

    await sequelize.query(
        `INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
         SELECT r.id, p.id, NOW(), NOW()
         FROM roles r CROSS JOIN permissions p
         WHERE r.name = 'superadmin'
           AND p.resource = :resource AND p.action = :action
           AND NOT EXISTS (
               SELECT 1 FROM role_permissions rp
               WHERE rp.role_id = r.id AND rp.permission_id = p.id
           )`,
        { replacements: { resource: RESOURCE, action: ACTION } }
    );
};

export const down: Migration = async ({ context: queryInterface }) => {
    const sequelize = queryInterface.sequelize;
    await sequelize.query(
        `DELETE FROM permissions WHERE resource = :resource AND action = :action`,
        { replacements: { resource: RESOURCE, action: ACTION } }
    );
};
