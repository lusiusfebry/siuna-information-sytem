import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../config/database';

export class InvOpnameDetail extends Model {
    public id!: number;
    public opname_session_id!: number;
    public produk_id!: number;
    public jumlah_sistem_snapshot!: number;
    public jumlah_fisik!: number | null;
    public selisih!: number | null;
    public catatan!: string | null;
    public tipe_hitung!: 'Fisik' | 'Serial';

    public session?: any;
    public produk?: any;
    public serials?: any[];

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

InvOpnameDetail.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    opname_session_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'inv_opname_session', key: 'id' },
    },
    produk_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'inv_produk', key: 'id' },
    },
    jumlah_sistem_snapshot: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    jumlah_fisik: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    selisih: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    catatan: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    tipe_hitung: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'Fisik',
    },
}, {
    sequelize,
    tableName: 'inv_opname_detail',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    // Cocok dengan idx_opname_detail_session_produk (migrasi 70). Wajib
    // dideklarasikan agar upsert() memakai ON CONFLICT (opname_session_id,
    // produk_id) alih-alih ON CONFLICT ("id") yang tak pernah cocok.
    indexes: [
        {
            unique: true,
            name: 'idx_opname_detail_session_produk',
            fields: ['opname_session_id', 'produk_id'],
        },
    ],
});

export default InvOpnameDetail;
