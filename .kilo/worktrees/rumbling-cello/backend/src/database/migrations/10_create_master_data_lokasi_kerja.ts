import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

export const up: Migration = async ({ context: queryInterface }) => {
    await queryInterface.createTable('lokasi_kerja', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        nama: { type: DataTypes.STRING(100), allowNull: false },
        alamat: { type: DataTypes.TEXT, allowNull: true },
        keterangan: { type: DataTypes.TEXT, allowNull: true },
        status: {
            type: DataTypes.ENUM('Aktif', 'Tidak Aktif'),
            allowNull: false,
            defaultValue: 'Aktif',
        },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });

    await queryInterface.addIndex('lokasi_kerja', ['status']);
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.dropTable('lokasi_kerja');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_lokasi_kerja_status');
};
