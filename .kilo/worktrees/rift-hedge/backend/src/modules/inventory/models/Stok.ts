import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../config/database';
import cacheService from '../../../shared/services/cache.service';

export class InvStok extends Model {
    public id!: number;
    public produk_id!: number;
    public gudang_id!: number;
    public uom_id!: number;
    public jumlah!: number;

    public produk?: any;
    public gudang?: any;
    public uom?: any;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

InvStok.init({
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
    gudang_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'inv_gudang', key: 'id' },
    },
    uom_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'inv_uom', key: 'id' },
    },
    jumlah: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
}, {
    sequelize,
    tableName: 'inv_stok',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

InvStok.addHook('afterCreate', async () => {
    await cacheService.delPattern('inv_stok:*');
});

InvStok.addHook('afterUpdate', async () => {
    await cacheService.delPattern('inv_stok:*');
});

export default InvStok;
