import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

export const up: Migration = async ({ context: queryInterface }) => {
    await queryInterface.createTable('golongan', {
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

    await queryInterface.addIndex('golongan', ['status']);
    await queryInterface.addIndex('golongan', ['nama']);
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.dropTable('golongan');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_golongan_status');
};
