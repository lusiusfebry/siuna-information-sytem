import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../config/database';

export type OpnameStatus = 'Draft' | 'Berjalan' | 'Selesai' | 'Approved' | 'Dibatalkan';

export class InvOpnameSession extends Model {
    public id!: number;
    public kode!: string;
    public gudang_id!: number;
    public status!: OpnameStatus;
    public tanggal_mulai!: Date | null;
    public tanggal_selesai!: Date | null;
    public catatan!: string | null;
    public transaksi_id!: number | null;
    public created_by!: number | null;
    public approved_by!: number | null;
    public approved_at!: Date | null;

    public gudang?: any;
    public transaksi?: any;
    public creator?: any;
    public approver?: any;
    public detail?: any[];

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public readonly deleted_at!: Date | null;
}

InvOpnameSession.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    kode: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    gudang_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'inv_gudang', key: 'id' },
    },
    status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'Draft',
    },
    tanggal_mulai: { type: DataTypes.DATE, allowNull: true },
    tanggal_selesai: { type: DataTypes.DATE, allowNull: true },
    catatan: { type: DataTypes.TEXT, allowNull: true },
    transaksi_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'inv_transaksi', key: 'id' },
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
    },
    approved_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
    },
    approved_at: { type: DataTypes.DATE, allowNull: true },
}, {
    sequelize,
    tableName: 'inv_opname_session',
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
});

export default InvOpnameSession;
