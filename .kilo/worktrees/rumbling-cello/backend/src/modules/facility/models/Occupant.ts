import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../config/database';

export class FacilityOccupant extends Model {
    public id!: number;
    public room_id!: number;
    public employee_id!: number;
    public tanggal_masuk!: string;
    public tanggal_keluar!: string | null;
    public keterangan!: string | null;
    public status!: 'Aktif' | 'Selesai';
    public created_by!: number | null;

    public room?: any;
    public employee?: any;
    public creator?: any;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

FacilityOccupant.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    room_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'facility_rooms', key: 'id' } },
    employee_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'employees', key: 'id' } },
    tanggal_masuk: { type: DataTypes.DATEONLY, allowNull: false },
    tanggal_keluar: { type: DataTypes.DATEONLY, allowNull: true },
    keterangan: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('Aktif', 'Selesai'), allowNull: false, defaultValue: 'Aktif' },
    created_by: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
}, {
    sequelize, tableName: 'facility_occupants', timestamps: true,
    createdAt: 'created_at', updatedAt: 'updated_at',
});

export default FacilityOccupant;
