import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../config/database';
import Employee from './Employee';

export class Attendance extends Model {
    public id!: number;
    public employee_id!: number;
    public tanggal!: Date;
    public status!: 'Hadir' | 'Telat' | 'Ijin' | 'Sakit' | 'Alpa';
    public jam_masuk!: string | null;
    public jam_keluar!: string | null;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

Attendance.init({
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
    tanggal: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('Hadir', 'Telat', 'Ijin', 'Sakit', 'Alpa'),
        allowNull: false,
    },
    jam_masuk: {
        type: DataTypes.TIME,
        allowNull: true,
    },
    jam_keluar: {
        type: DataTypes.TIME,
        allowNull: true,
    },
}, {
    sequelize,
    tableName: 'attendances',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

Attendance.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });
Employee.hasMany(Attendance, { foreignKey: 'employee_id', as: 'attendances' });

export default Attendance;
