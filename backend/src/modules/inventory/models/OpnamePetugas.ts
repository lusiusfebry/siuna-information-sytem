import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../config/database';

export class InvOpnamePetugas extends Model {
    public id!: number;
    public opname_session_id!: number;
    public karyawan_id!: number;

    public session?: any;
    public karyawan?: any;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

InvOpnamePetugas.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    opname_session_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'inv_opname_session', key: 'id' },
    },
    karyawan_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'employees', key: 'id' },
    },
}, {
    sequelize,
    tableName: 'inv_opname_petugas',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            unique: true,
            name: 'idx_opname_petugas_session_karyawan',
            fields: ['opname_session_id', 'karyawan_id'],
        },
    ],
});

export default InvOpnamePetugas;
