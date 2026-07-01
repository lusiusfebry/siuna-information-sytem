import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../config/database';
import cacheService from '../../../shared/services/cache.service';

export class InvProduk extends Model {
    public id!: number;
    public code!: string;
    public nama!: string;
    public brand_id!: number;
    public has_serial_number!: boolean;
    public has_tag_number!: boolean;
    public stok_minimum!: number | null;
    public gambar!: string | null;
    public keterangan!: string | null;
    public status!: 'Aktif' | 'Tidak Aktif';

    public brand?: any;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public readonly deleted_at!: Date | null;
}

InvProduk.init({
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
            notEmpty: { msg: 'Nama produk tidak boleh kosong' },
        },
    },
    brand_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'inv_brand',
            key: 'id',
        },
    },
    has_serial_number: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    has_tag_number: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    stok_minimum: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 5,
    },
    gambar: {
        type: DataTypes.STRING(500),
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
    tableName: 'inv_produk',
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
});

InvProduk.addHook('afterCreate', async () => {
    await cacheService.delPattern('inv_master_data:InvProduk:*');
});

InvProduk.addHook('afterUpdate', async () => {
    await cacheService.delPattern('inv_master_data:InvProduk:*');
});

InvProduk.addHook('afterDestroy', async () => {
    await cacheService.delPattern('inv_master_data:InvProduk:*');
});

export default InvProduk;
