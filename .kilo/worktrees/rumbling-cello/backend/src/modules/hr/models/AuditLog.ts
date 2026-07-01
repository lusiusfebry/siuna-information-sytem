import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../../config/database';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';

export interface AuditLogAttributes {
    id: number;
    user_id?: number | null;
    user_nik?: string | null;
    user_name?: string | null;
    action: AuditAction;
    entity_type: string;
    entity_id?: number | null;
    entity_name?: string | null;
    old_values?: any | null; // JSONB
    new_values?: any | null; // JSONB
    ip_address?: string | null;
    user_agent?: string | null;
    timestamp: Date;
    created_at?: Date;
}

export type AuditLogCreationAttributes = Optional<AuditLogAttributes, 'id' | 'timestamp' | 'created_at'>;

export class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
    public id!: number;
    public user_id?: number | null;
    public user_nik?: string | null;
    public user_name?: string | null;
    public action!: AuditAction;
    public entity_type!: string;
    public entity_id?: number | null;
    public entity_name?: string | null;
    public old_values?: any | null;
    public new_values?: any | null;
    public ip_address?: string | null;
    public user_agent?: string | null;
    public timestamp!: Date;
    public readonly created_at!: Date;
}

AuditLog.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    user_nik: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    user_name: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    action: {
        type: DataTypes.ENUM('CREATE', 'UPDATE', 'DELETE', 'VIEW'),
        allowNull: false,
    },
    entity_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    entity_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    entity_name: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    old_values: {
        type: DataTypes.JSONB,
        allowNull: true,
    },
    new_values: {
        type: DataTypes.JSONB,
        allowNull: true,
    },
    ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true,
    },
    user_agent: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    sequelize,
    tableName: 'audit_logs',
    timestamps: false, // We handle timestamp manually or via default, standard createdAt is used
    underscored: true
});

export default AuditLog;
