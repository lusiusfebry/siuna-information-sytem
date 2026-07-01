import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../config/database';
import cacheService from '../../../shared/services/cache.service';

export class FacilityRoom extends Model {
    public id!: number;
    public code!: string;
    public nama!: string;
    public building_id!: number;
    public room_type_id!: number | null;
    public lantai!: string | null;
    public kapasitas!: number;
    public keterangan!: string | null;
    public status!: 'Tersedia' | 'Penuh' | 'Maintenance' | 'Tidak Aktif';

    public building?: any;
    public room_type?: any;
    public occupants?: any[];
    public assets?: any[];

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public readonly deleted_at!: Date | null;
}

FacilityRoom.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    nama: {
        type: DataTypes.STRING(100), allowNull: false,
        validate: { notEmpty: { msg: 'Nama ruangan tidak boleh kosong' } },
    },
    building_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'facility_buildings', key: 'id' } },
    room_type_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'facility_room_types', key: 'id' } },
    lantai: { type: DataTypes.STRING(20), allowNull: true },
    kapasitas: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    keterangan: { type: DataTypes.TEXT, allowNull: true },
    status: {
        type: DataTypes.ENUM('Tersedia', 'Penuh', 'Maintenance', 'Tidak Aktif'),
        allowNull: false, defaultValue: 'Tersedia',
    },
}, {
    sequelize, tableName: 'facility_rooms', timestamps: true, paranoid: true,
    createdAt: 'created_at', updatedAt: 'updated_at', deletedAt: 'deleted_at',
});

FacilityRoom.addHook('afterCreate', async () => { await cacheService.delPattern('facility:Room:*'); });
FacilityRoom.addHook('afterUpdate', async () => { await cacheService.delPattern('facility:Room:*'); });
FacilityRoom.addHook('afterDestroy', async () => { await cacheService.delPattern('facility:Room:*'); });

export default FacilityRoom;
