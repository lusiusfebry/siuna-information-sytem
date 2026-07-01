import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../config/database';

export class InvTransaksi extends Model {
    public id!: number;
    public code!: string;
    public tipe!: 'Masuk' | 'Keluar' | 'Adjustment';
    public sub_tipe!: 'Supplier' | 'Transfer Masuk' | 'Retur Karyawan' | 'Ke Karyawan' | 'Transfer Gudang' | 'Disposal' | 'Opname' | 'Ke Gedung/Mess' | 'Rusak/Terbuang';
    public tanggal!: string;
    public gudang_id!: number;
    public gudang_tujuan_id!: number | null;
    public karyawan_id!: number | null;
    public supplier_nama!: string | null;
    public no_referensi!: string | null;
    public catatan!: string | null;
    public dokumen!: any[] | null;
    public created_by!: number | null;

    public gudang?: any;
    public gudang_tujuan?: any;
    public karyawan?: any;
    public creator?: any;
    public details?: any[];

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

InvTransaksi.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
    },
    tipe: {
        type: DataTypes.ENUM('Masuk', 'Keluar', 'Adjustment'),
        allowNull: false,
    },
    sub_tipe: {
        type: DataTypes.ENUM('Supplier', 'Transfer Masuk', 'Retur Karyawan', 'Ke Karyawan', 'Transfer Gudang', 'Disposal', 'Opname', 'Ke Gedung/Mess', 'Rusak/Terbuang'),
        allowNull: false,
    },
    tanggal: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    gudang_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'inv_gudang', key: 'id' },
    },
    gudang_tujuan_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'inv_gudang', key: 'id' },
    },
    karyawan_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'employees', key: 'id' },
    },
    supplier_nama: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    no_referensi: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    catatan: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    dokumen: {
        type: DataTypes.JSONB,
        allowNull: true,
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
    },
}, {
    sequelize,
    tableName: 'inv_transaksi',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

export default InvTransaksi;
