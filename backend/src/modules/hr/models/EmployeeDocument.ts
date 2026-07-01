import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../../config/database';
import Employee from './Employee';

export interface EmployeeDocumentAttributes {
    id: number;
    employee_id: number;
    document_type: string;
    file_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    uploaded_by?: number;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export type EmployeeDocumentCreationAttributes = Optional<EmployeeDocumentAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export class EmployeeDocument extends Model<EmployeeDocumentAttributes, EmployeeDocumentCreationAttributes> implements EmployeeDocumentAttributes {
    public id!: number;
    public employee_id!: number;
    public document_type!: string;
    public file_name!: string;
    public file_path!: string;
    public file_size!: number;
    public mime_type!: string;
    public uploaded_by?: number;
    public description?: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    public readonly employee?: Employee;
}

EmployeeDocument.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'employees',
            key: 'id'
        }
    },
    document_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    file_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    file_path: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    file_size: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    mime_type: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    uploaded_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    sequelize,
    tableName: 'employee_documents',
});

export default EmployeeDocument;
