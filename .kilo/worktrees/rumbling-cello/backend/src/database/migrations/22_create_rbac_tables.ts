import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

export const up: Migration = async ({ context: queryInterface }) => {
    // 1. Create permissions table
    await queryInterface.createTable('permissions', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        resource: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        action: {
            type: DataTypes.STRING(20),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        created_at: {
            allowNull: false,
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            allowNull: false,
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    });

    // Add unique constraint to permissions
    await queryInterface.addConstraint('permissions', {
        fields: ['resource', 'action'],
        type: 'unique',
        name: 'unique_permission_resource_action'
    });

    // 2. Create roles table
    await queryInterface.createTable('roles', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true
        },
        display_name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        is_system_role: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false
        },
        created_at: {
            allowNull: false,
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            allowNull: false,
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    });

    // 3. Create role_permissions junction table
    await queryInterface.createTable('role_permissions', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        role_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'roles',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        },
        permission_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'permissions',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        },
        created_at: {
            allowNull: false,
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            allowNull: false,
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    });

    // Add unique constraint to role_permissions
    await queryInterface.addConstraint('role_permissions', {
        fields: ['role_id', 'permission_id'],
        type: 'unique',
        name: 'unique_role_permission'
    });
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.dropTable('role_permissions');
    await queryInterface.dropTable('roles');
    await queryInterface.dropTable('permissions');
};
