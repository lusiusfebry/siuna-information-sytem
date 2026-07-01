import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../config/database';

export class Tag extends Model {
    public id!: number;
    public code!: string;
    public nama!: string;
    public warna_tag!: string;
    public keterangan!: string | null;
    public status!: 'Aktif' | 'Tidak Aktif';

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
    public readonly deleted_at!: Date | null;
}

Tag.init({
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
            notEmpty: { msg: 'Nama tag tidak boleh kosong' },
        },
    },
    warna_tag: {
        type: DataTypes.STRING(7),
        allowNull: false,
        defaultValue: '#3B82F6',
        validate: {
            is: {
                args: /^#[0-9A-F]{6}$/i,
                msg: 'Warna tag harus dalam format hex (#RRGGBB)',
            },
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
    tableName: 'tag',
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
});

export default Tag;
