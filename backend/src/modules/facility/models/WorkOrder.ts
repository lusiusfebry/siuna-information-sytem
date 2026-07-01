import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../config/database';

export class FacilityWorkOrder extends Model {
    public id!: number;
    public code!: string;
    public room_id!: number;
    public kategori_id!: number | null;
    public judul!: string;
    public deskripsi!: string | null;
    public prioritas!: 'Low' | 'Medium' | 'High' | 'Critical';
    public status!: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
    public reported_by!: number | null;
    public assigned_to!: number | null;
    public tanggal_lapor!: string;
    public tanggal_selesai!: string | null;
    public estimasi_biaya!: number | null;
    public realisasi_biaya!: number | null;
    public catatan_penyelesaian!: string | null;
    public created_by!: number | null;

    public room?: any;
    public kategori?: any;
    public reporter?: any;
    public assignee?: any;
    public creator?: any;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

FacilityWorkOrder.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    room_id: { type: DataTypes.INTEGER, allowNull: false },
    kategori_id: { type: DataTypes.INTEGER, allowNull: true },
    judul: {
        type: DataTypes.STRING(200), allowNull: false,
        validate: { notEmpty: { msg: 'Judul work order tidak boleh kosong' } },
    },
    deskripsi: { type: DataTypes.TEXT, allowNull: true },
    prioritas: {
        type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
        allowNull: false, defaultValue: 'Medium',
    },
    status: {
        type: DataTypes.ENUM('Open', 'In Progress', 'Resolved', 'Closed'),
        allowNull: false, defaultValue: 'Open',
    },
    reported_by: { type: DataTypes.INTEGER, allowNull: true },
    assigned_to: { type: DataTypes.INTEGER, allowNull: true },
    tanggal_lapor: { type: DataTypes.DATEONLY, allowNull: false },
    tanggal_selesai: { type: DataTypes.DATEONLY, allowNull: true },
    estimasi_biaya: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
    realisasi_biaya: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
    catatan_penyelesaian: { type: DataTypes.TEXT, allowNull: true },
    created_by: { type: DataTypes.INTEGER, allowNull: true },
}, {
    sequelize, tableName: 'facility_work_orders', timestamps: true,
    createdAt: 'created_at', updatedAt: 'updated_at',
});

export default FacilityWorkOrder;
