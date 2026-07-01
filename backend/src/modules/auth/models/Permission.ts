import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../../config/database';

export interface PermissionAttributes {
    id: number;
    resource: string;
    action: string;
    description?: string;
    created_at?: Date;
    updated_at?: Date;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PermissionCreationAttributes extends Optional<PermissionAttributes, 'id' | 'description' | 'created_at' | 'updated_at'> { }

export class Permission extends Model<PermissionAttributes, PermissionCreationAttributes> implements PermissionAttributes {
    public id!: number;
    public resource!: string;
    public action!: string;
    public description?: string;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

Permission.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    resource: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    action: {
        type: DataTypes.STRING(20),
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    sequelize,
    tableName: 'permissions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            unique: true,
            fields: ['resource', 'action']
        }
    ]
});
