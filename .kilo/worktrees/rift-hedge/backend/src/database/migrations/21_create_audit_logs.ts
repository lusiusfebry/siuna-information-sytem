import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

export const up: Migration = async ({ context: queryInterface }) => {
    await queryInterface.createTable('audit_logs', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id'
            },
            onUpdate: 'SET NULL',
            onDelete: 'SET NULL'
        },
        user_nik: {
            type: DataTypes.STRING(20),
            allowNull: true
        },
        user_name: {
            type: DataTypes.STRING(200),
            allowNull: true
        },
        action: {
            type: DataTypes.ENUM('CREATE', 'UPDATE', 'DELETE', 'VIEW'),
            allowNull: false
        },
        entity_type: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        entity_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        entity_name: {
            type: DataTypes.STRING(200),
            allowNull: true
        },
        old_values: {
            type: DataTypes.JSONB,
            allowNull: true
        },
        new_values: {
            type: DataTypes.JSONB,
            allowNull: true
        },
        ip_address: {
            type: DataTypes.STRING(45),
            allowNull: true
        },
        user_agent: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        timestamp: {
            allowNull: false,
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        created_at: {
            allowNull: false,
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    });

    // Indexes for performance
    await queryInterface.addIndex('audit_logs', ['user_id']);
    await queryInterface.addIndex('audit_logs', ['entity_type']);
    await queryInterface.addIndex('audit_logs', ['entity_id']);
    await queryInterface.addIndex('audit_logs', ['action']);
    await queryInterface.addIndex('audit_logs', ['timestamp']);

    // Composite index for entity history
    await queryInterface.addIndex('audit_logs', ['entity_type', 'entity_id']);
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.dropTable('audit_logs');
};
