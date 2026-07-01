import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../config/database';
import Employee from './Employee';

export class Leave extends Model {
    public id!: number;
    public employee_id!: number;
    public tanggal_mulai!: Date;
    public tanggal_selesai!: Date;
    public jenis!: 'Izin' | 'Cuti';
    public status!: 'Pending' | 'Approved' | 'Rejected';

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

Leave.init({
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
    tanggal_mulai: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    tanggal_selesai: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    jenis: {
        type: DataTypes.ENUM('Izin', 'Cuti'),
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
        allowNull: false,
        defaultValue: 'Pending'
    },
}, {
    sequelize,
    tableName: 'leaves',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

Leave.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });
Employee.hasMany(Leave, { foreignKey: 'employee_id', as: 'leaves' });

export default Leave;
