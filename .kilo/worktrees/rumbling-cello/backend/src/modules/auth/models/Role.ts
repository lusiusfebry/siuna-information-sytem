import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../../config/database';
import { Permission } from './Permission';

export interface RoleAttributes {
    id: number;
    name: string;
    display_name: string;
    description?: string;
    is_system_role: boolean;
    created_at?: Date;
    updated_at?: Date;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RoleCreationAttributes extends Optional<RoleAttributes, 'id' | 'description' | 'is_system_role' | 'created_at' | 'updated_at'> { }

export class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
    public id!: number;
    public name!: string;
    public display_name!: string;
    public description?: string;
    public is_system_role!: boolean;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;

    // Association mixins
    public permissions?: Permission[];

    public getPermissions!: any;
    public setPermissions!: (permissions: Permission[] | number[]) => Promise<void>;
    public addPermission!: (permission: Permission | number) => Promise<void>;
    public addPermissions!: (permissions: any[]) => Promise<void>;
    public removePermission!: (permission: any) => Promise<void>;
    public countPermissions!: () => Promise<number>;
    public hasPermission!: (permission: any) => Promise<boolean>;
}

Role.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    display_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    is_system_role: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
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
    tableName: 'roles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});
