import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

export const up: Migration = async ({ context: queryInterface }) => {
    await queryInterface.createTable('sub_golongan', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        nama: {
            type: DataTypes.STRING(100),
            allowNull: false,
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
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    });

    await queryInterface.addIndex('sub_golongan', ['status']);
    await queryInterface.addIndex('sub_golongan', ['nama']);
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.dropTable('sub_golongan');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_sub_golongan_status');
};
