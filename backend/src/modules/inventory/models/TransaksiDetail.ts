import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../config/database';

export class InvTransaksiDetail extends Model {
    public id!: number;
    public transaksi_id!: number;
    public produk_id!: number;
    public uom_id!: number;
    public jumlah!: number;
    public catatan!: string | null;

    public produk?: any;
    public uom?: any;
    public serial_numbers?: any[];

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

InvTransaksiDetail.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    transaksi_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'inv_transaksi', key: 'id' },
    },
    produk_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'inv_produk', key: 'id' },
    },
    uom_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'inv_uom', key: 'id' },
    },
    jumlah: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    catatan: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    sequelize,
    tableName: 'inv_transaksi_detail',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

export default InvTransaksiDetail;
