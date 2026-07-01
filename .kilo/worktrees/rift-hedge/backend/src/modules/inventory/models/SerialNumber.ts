import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../config/database';

export class InvSerialNumber extends Model {
    public id!: number;
    public produk_id!: number;
    public serial_number!: string | null;
    public tag_number!: string | null;
    public gudang_id!: number | null;
    public karyawan_id!: number | null;
    public status!: 'Tersedia' | 'Digunakan' | 'Rusak' | 'Disposed';
    public transaksi_masuk_id!: number | null;
    public transaksi_terakhir_id!: number | null;

    public produk?: any;
    public gudang?: any;
    public karyawan?: any;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

InvSerialNumber.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    produk_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'inv_produk', key: 'id' },
    },
    serial_number: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    tag_number: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true,
    },
    gudang_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'inv_gudang', key: 'id' },
    },
    karyawan_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'employees', key: 'id' },
    },
    status: {
        type: DataTypes.ENUM('Tersedia', 'Digunakan', 'Rusak', 'Disposed'),
        allowNull: false,
        defaultValue: 'Tersedia',
    },
    transaksi_masuk_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'inv_transaksi', key: 'id' },
    },
    transaksi_terakhir_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'inv_transaksi', key: 'id' },
    },
}, {
    sequelize,
    tableName: 'inv_serial_number',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

export default InvSerialNumber;
