import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../config/database';
import cacheService from '../../../shared/services/cache.service';

export class InvSubKategori extends Model {
    public id!: number;
    public code!: string;
    public nama!: string;
    public kategori_id!: number;
    public prefix_tag!: string | null;
    public keterangan!: string | null;
    public status!: 'Aktif' | 'Tidak Aktif';

    public kategori?: any;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public readonly deleted_at!: Date | null;
}

InvSubKategori.init({
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
            notEmpty: { msg: 'Nama sub kategori tidak boleh kosong' },
        },
    },
    kategori_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'inv_kategori',
            key: 'id',
        },
    },
    prefix_tag: {
        type: DataTypes.STRING(100),
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
    tableName: 'inv_sub_kategori',
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
});

InvSubKategori.addHook('afterCreate', async () => {
    await cacheService.delPattern('inv_master_data:InvSubKategori:*');
});

InvSubKategori.addHook('afterUpdate', async () => {
    await cacheService.delPattern('inv_master_data:InvSubKategori:*');
});

InvSubKategori.addHook('afterDestroy', async () => {
    await cacheService.delPattern('inv_master_data:InvSubKategori:*');
});

export default InvSubKategori;
