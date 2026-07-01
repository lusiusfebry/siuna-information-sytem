import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../config/database';
import cacheService from '../../../shared/services/cache.service';

export class Divisi extends Model {
    public id!: number;
    public code!: string;
    public nama!: string;
    public keterangan!: string | null;
    public status!: 'Aktif' | 'Tidak Aktif';

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public readonly deleted_at!: Date | null;
}

Divisi.init({
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
            notEmpty: { msg: 'Nama divisi tidak boleh kosong' },
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
    tableName: 'divisi',
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
});

Divisi.addHook('afterCreate', async () => {
    await cacheService.delPattern('master_data:Divisi:*');
});

Divisi.addHook('afterUpdate', async () => {
    await cacheService.delPattern('master_data:Divisi:*');
});

Divisi.addHook('afterDestroy', async () => {
    await cacheService.delPattern('master_data:Divisi:*');
});

export default Divisi;
