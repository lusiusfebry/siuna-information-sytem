import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../config/database';
import cacheService from '../../../shared/services/cache.service';

export class FacilityMaintenanceCategory extends Model {
    public id!: number;
    public code!: string;
    public nama!: string;
    public keterangan!: string | null;
    public status!: 'Aktif' | 'Tidak Aktif';

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public readonly deleted_at!: Date | null;
}

FacilityMaintenanceCategory.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    nama: {
        type: DataTypes.STRING(100), allowNull: false,
        validate: { notEmpty: { msg: 'Nama kategori tidak boleh kosong' } },
    },
    keterangan: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('Aktif', 'Tidak Aktif'), allowNull: false, defaultValue: 'Aktif' },
}, {
    sequelize, tableName: 'facility_maintenance_categories', timestamps: true, paranoid: true,
    createdAt: 'created_at', updatedAt: 'updated_at', deletedAt: 'deleted_at',
});

FacilityMaintenanceCategory.addHook('afterCreate', async () => { await cacheService.delPattern('facility:MaintenanceCategory:*'); });
FacilityMaintenanceCategory.addHook('afterUpdate', async () => { await cacheService.delPattern('facility:MaintenanceCategory:*'); });
FacilityMaintenanceCategory.addHook('afterDestroy', async () => { await cacheService.delPattern('facility:MaintenanceCategory:*'); });

export default FacilityMaintenanceCategory;
