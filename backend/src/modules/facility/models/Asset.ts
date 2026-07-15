import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../config/database';

export class FacilityAsset extends Model {
    public id!: number;
    public room_id!: number;
    public serial_number_id!: number;
    public tanggal_penempatan!: string;
    public tanggal_penarikan!: string | null;
    public keterangan!: string | null;
    public status!: 'Aktif' | 'Ditarik';
    public transaksi_id!: number | null;
    public created_by!: number | null;

    public room?: any;
    public serial_number?: any;
    public creator?: any;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

FacilityAsset.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    room_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'facility_rooms', key: 'id' } },
    serial_number_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'inv_serial_number', key: 'id' } },
    tanggal_penempatan: { type: DataTypes.DATEONLY, allowNull: false },
    tanggal_penarikan: { type: DataTypes.DATEONLY, allowNull: true },
    keterangan: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('Aktif', 'Ditarik'), allowNull: false, defaultValue: 'Aktif' },
    transaksi_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'inv_transaksi', key: 'id' } },
    created_by: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
}, {
    sequelize, tableName: 'facility_assets', timestamps: true,
    createdAt: 'created_at', updatedAt: 'updated_at',
});

export default FacilityAsset;
