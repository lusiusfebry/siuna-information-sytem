import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../config/database';

export class LokasiKerja extends Model {
    public id!: number;
    public code!: string;
    public nama!: string;
    public kode_site!: string | null;
    public alamat!: string | null;
    public keterangan!: string | null;
    public status!: 'Aktif' | 'Tidak Aktif';

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public readonly deleted_at!: Date | null;
}

LokasiKerja.init({
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
    nama: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Nama lokasi kerja tidak boleh kosong' },
        },
    },
    kode_site: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    alamat: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    keterangan: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('Aktif', 'Tidak Aktif'),
        allowNull: false,
        defaultValue: 'Aktif',
    },
}, {
    sequelize,
    tableName: 'lokasi_kerja',
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
});

export default LokasiKerja;
