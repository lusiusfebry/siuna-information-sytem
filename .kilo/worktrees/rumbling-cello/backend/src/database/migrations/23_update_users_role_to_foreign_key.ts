import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

export const up: Migration = async ({ context: queryInterface }) => {
    // 1. Add role_id column (initially nullable)
    await queryInterface.addColumn('users', 'role_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'roles',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
    });

    // 2. Insert basic roles
    const roles = [
        { name: 'superadmin', display_name: 'Super Administrator', is_system_role: true },
        { name: 'admin', display_name: 'HR Admin', is_system_role: true },
        { name: 'staff', display_name: 'HR Staff', is_system_role: true },
        { name: 'employee', display_name: 'Employee', is_system_role: true },
    ];

    const now = new Date();
    await queryInterface.bulkInsert('roles', roles.map(r => ({
        ...r,
        created_at: now,
        updated_at: now
    })));

    // 3. Update users role_id based on role enum (PostgreSQL syntax)
    await queryInterface.sequelize.query(`
        UPDATE users
        SET role_id = r.id
        FROM roles r
        WHERE users.role::text = r.name;
    `);

    // 4. Drop old role column
    await queryInterface.removeColumn('users', 'role');
};

export const down: Migration = async ({ context: queryInterface }) => {
    // 1. Add role column back
    await queryInterface.addColumn('users', 'role', {
        type: DataTypes.ENUM('superadmin', 'admin', 'staff', 'employee'),
        allowNull: false,
        defaultValue: 'employee'
    });

    // 2. Data Migration: Map role_id back to name (PostgreSQL syntax)
    await queryInterface.sequelize.query(`
        UPDATE users
        SET role = r.name::enum_users_role
        FROM roles r
        WHERE users.role_id = r.id;
    `);

    // 3. Drop role_id column
    await queryInterface.removeColumn('users', 'role_id');
};
