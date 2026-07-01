import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../config/database';
import cacheService from '../../../shared/services/cache.service';

export class FacilityRoomType extends Model {
    public id!: number;
    public code!: string;
    public nama!: string;
    public keterangan!: string | null;
    public status!: 'Aktif' | 'Tidak Aktif';

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public readonly deleted_at!: Date | null;
}

FacilityRoomType.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    nama: {
        type: DataTypes.STRING(100), allowNull: false,
        validate: { notEmpty: { msg: 'Nama tipe kamar tidak boleh kosong' } },
    },
    keterangan: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('Aktif', 'Tidak Aktif'), allowNull: false, defaultValue: 'Aktif' },
}, {
    sequelize, tableName: 'facility_room_types', timestamps: true, paranoid: true,
    createdAt: 'created_at', updatedAt: 'updated_at', deletedAt: 'deleted_at',
});

FacilityRoomType.addHook('afterCreate', async () => { await cacheService.delPattern('facility:RoomType:*'); });
FacilityRoomType.addHook('afterUpdate', async () => { await cacheService.delPattern('facility:RoomType:*'); });
FacilityRoomType.addHook('afterDestroy', async () => { await cacheService.delPattern('facility:RoomType:*'); });

export default FacilityRoomType;
