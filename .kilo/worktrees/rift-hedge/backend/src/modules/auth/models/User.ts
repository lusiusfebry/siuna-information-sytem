import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../config/database';
import Employee from '../../hr/models/Employee';
import { Role } from './Role';
import bcrypt from 'bcryptjs';

export class User extends Model {
    public id!: number;
    public nama!: string;
    public nik!: string;
    public password!: string;
    public employee_id!: number | null;
    public role_id!: number | null;
    public is_active!: boolean;
    public last_login!: Date | null;
    public employee?: Employee;
    public roleDetails?: Role;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;

    public async validatePassword(password: string): Promise<boolean> {
        return await bcrypt.compare(password, this.password);
    }
}

User.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    nama: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    nik: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    employee_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'employees',
            key: 'id',
        },
    },
    role_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'roles',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    last_login: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    created_at: {
        type: DataTypes.DATE,
        field: 'created_at',
        defaultValue: DataTypes.NOW,
    },
    updated_at: {
        type: DataTypes.DATE,
        field: 'updated_at',
        defaultValue: DataTypes.NOW,
    }
}, {
    sequelize,
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
        beforeCreate: async (user: User) => {
            if (user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        },
        beforeUpdate: async (user: User) => {
            if (user.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        }
    }
});

// Define association
// Moved to associations.ts to avoid circular dependencies and duplicate alias errors

export default User;
