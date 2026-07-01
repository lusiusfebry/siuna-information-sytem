import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../config/database';

export class PosisiJabatan extends Model {
    public id!: number;
    public code!: string;
    public nama!: string;
    public department_id!: number;
    public keterangan!: string | null;
    public status!: 'Aktif' | 'Tidak Aktif';

    public department?: any;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public readonly deleted_at!: Date | null;
}

PosisiJabatan.init({
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
            notEmpty: { msg: 'Nama posisi jabatan tidak boleh kosong' },
        },
    },
    department_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'department',
            key: 'id',
        },
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
    tableName: 'posisi_jabatan',
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
});

export default PosisiJabatan;
