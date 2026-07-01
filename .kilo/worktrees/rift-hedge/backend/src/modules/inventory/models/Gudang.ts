import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../config/database';
import cacheService from '../../../shared/services/cache.service';

export class InvGudang extends Model {
    public id!: number;
    public code!: string;
    public nama!: string;
    public penanggung_jawab_id!: number | null;
    public department_id!: number | null;
    public lokasi_kerja_id!: number | null;
    public lokasi!: string | null;
    public keterangan!: string | null;
    public status!: 'Aktif' | 'Tidak Aktif';

    public penanggung_jawab?: any;
    public department?: any;
    public lokasi_kerja?: any;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public readonly deleted_at!: Date | null;
}

InvGudang.init({
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
            notEmpty: { msg: 'Nama gudang tidak boleh kosong' },
        },
    },
    penanggung_jawab_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'employees',
            key: 'id',
        },
    },
    department_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'department',
            key: 'id',
        },
    },
    lokasi_kerja_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'lokasi_kerja',
            key: 'id',
        },
    },
    lokasi: {
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
    tableName: 'inv_gudang',
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
});

InvGudang.addHook('afterCreate', async () => {
    await cacheService.delPattern('inv_master_data:InvGudang:*');
});

InvGudang.addHook('afterUpdate', async () => {
    await cacheService.delPattern('inv_master_data:InvGudang:*');
});

InvGudang.addHook('afterDestroy', async () => {
    await cacheService.delPattern('inv_master_data:InvGudang:*');
});

export default InvGudang;
