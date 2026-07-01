import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../config/database';
import cacheService from '../../../shared/services/cache.service';

export class InvBrand extends Model {
    public id!: number;
    public code!: string;
    public nama!: string;
    public sub_kategori_id!: number;
    public keterangan!: string | null;
    public status!: 'Aktif' | 'Tidak Aktif';

    public sub_kategori?: any;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public readonly deleted_at!: Date | null;
}

InvBrand.init({
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
            notEmpty: { msg: 'Nama brand tidak boleh kosong' },
        },
    },
    sub_kategori_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'inv_sub_kategori',
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
    tableName: 'inv_brand',
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
});

InvBrand.addHook('afterCreate', async () => {
    await cacheService.delPattern('inv_master_data:InvBrand:*');
});

InvBrand.addHook('afterUpdate', async () => {
    await cacheService.delPattern('inv_master_data:InvBrand:*');
});

InvBrand.addHook('afterDestroy', async () => {
    await cacheService.delPattern('inv_master_data:InvBrand:*');
});

export default InvBrand;
