import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

export const up: Migration = async ({ context: queryInterface }) => {
    await queryInterface.createTable('employee_documents', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        employee_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'employees',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        },
        document_type: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        file_name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        file_path: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        file_size: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        mime_type: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        uploaded_by: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        createdAt: {
            allowNull: false,
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updatedAt: {
            allowNull: false,
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    });

    await queryInterface.addIndex('employee_documents', ['employee_id']);
    await queryInterface.addIndex('employee_documents', ['document_type']);
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.dropTable('employee_documents');
};
