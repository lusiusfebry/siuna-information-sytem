import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../config/database';
import cacheService from '../../../shared/services/cache.service';

export class FacilityBuilding extends Model {
    public id!: number;
    public code!: string;
    public nama!: string;
    public tipe!: 'Mess' | 'Kantor' | 'Workshop' | 'Lainnya';
    public lokasi_kerja_id!: number | null;
    public alamat!: string | null;
    public penanggung_jawab_id!: number | null;
    public kapasitas_total!: number | null;
    public keterangan!: string | null;
    public status!: 'Aktif' | 'Tidak Aktif';

    public lokasi_kerja?: any;
    public penanggung_jawab?: any;
    public rooms?: any[];

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public readonly deleted_at!: Date | null;
}

FacilityBuilding.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    nama: {
        type: DataTypes.STRING(100), allowNull: false,
        validate: { notEmpty: { msg: 'Nama gedung tidak boleh kosong' } },
    },
    tipe: {
        type: DataTypes.ENUM('Mess', 'Kantor', 'Workshop', 'Lainnya'),
        allowNull: false, defaultValue: 'Mess',
    },
    lokasi_kerja_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'lokasi_kerja', key: 'id' } },
    alamat: { type: DataTypes.TEXT, allowNull: true },
    penanggung_jawab_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'employees', key: 'id' } },
    kapasitas_total: { type: DataTypes.INTEGER, allowNull: true },
    keterangan: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('Aktif', 'Tidak Aktif'), allowNull: false, defaultValue: 'Aktif' },
}, {
    sequelize, tableName: 'facility_buildings', timestamps: true, paranoid: true,
    createdAt: 'created_at', updatedAt: 'updated_at', deletedAt: 'deleted_at',
});

FacilityBuilding.addHook('afterCreate', async () => { await cacheService.delPattern('facility:Building:*'); });
FacilityBuilding.addHook('afterUpdate', async () => { await cacheService.delPattern('facility:Building:*'); });
FacilityBuilding.addHook('afterDestroy', async () => { await cacheService.delPattern('facility:Building:*'); });

export default FacilityBuilding;
