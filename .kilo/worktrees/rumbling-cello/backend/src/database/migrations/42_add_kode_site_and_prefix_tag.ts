import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

export const up: Migration = async ({ context: queryInterface }) => {
    await queryInterface.addColumn('lokasi_kerja', 'kode_site', {
        type: DataTypes.STRING(50),
        allowNull: true,
    });

    await queryInterface.addColumn('inv_kategori', 'prefix_tag', {
        type: DataTypes.STRING(100),
        allowNull: true,
    });
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.removeColumn('lokasi_kerja', 'kode_site');
    await queryInterface.removeColumn('inv_kategori', 'prefix_tag');
};
