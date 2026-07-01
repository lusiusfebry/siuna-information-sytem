import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../config/database';
import { Role } from './Role';
import { Permission } from './Permission';

export class RolePermission extends Model {
    public id!: number;
    public role_id!: number;
    public permission_id!: number;
}

RolePermission.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Role,
            key: 'id'
        }
    },
    permission_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Permission,
            key: 'id'
        }
    }
}, {
    sequelize,
    tableName: 'role_permissions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

// Define Relationships here or in associations file.
// Ideally in associations.ts or main index.ts
Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'role_id', as: 'permissions' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permission_id', as: 'roles' });
