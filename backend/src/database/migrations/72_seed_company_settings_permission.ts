import { Migration } from '../umzug';

// F-2: replace role-name authorize() on company-settings routes with RBAC
// checkPermission. This migration seeds the permission row and grants it to
// superadmin and admin so the routes keep working after the switch.

const RESOURCE = 'company_settings';
const ACTIONS = ['update'];

export const up: Migration = async ({ context: queryInterface }) => {
    const sequelize = queryInterface.sequelize;

    for (const action of ACTIONS) {
        await sequelize.query(
            `INSERT INTO permissions (resource, action, created_at, updated_at)
             SELECT :resource, :action, NOW(), NOW()
             WHERE NOT EXISTS (
                 SELECT 1 FROM permissions WHERE resource = :resource AND action = :action
             )`,
            { replacements: { resource: RESOURCE, action } }
        );

        await sequelize.query(
            `INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
             SELECT r.id, p.id, NOW(), NOW()
             FROM roles r CROSS JOIN permissions p
             WHERE r.name IN ('superadmin', 'admin')
               AND p.resource = :resource AND p.action = :action
               AND NOT EXISTS (
                   SELECT 1 FROM role_permissions rp
                   WHERE rp.role_id = r.id AND rp.permission_id = p.id
               )`,
            { replacements: { resource: RESOURCE, action } }
        );
    }
};

export const down: Migration = async ({ context: queryInterface }) => {
    const sequelize = queryInterface.sequelize;
    await sequelize.query(
        `DELETE FROM permissions WHERE resource = :resource`,
        { replacements: { resource: RESOURCE } }
    );
};
