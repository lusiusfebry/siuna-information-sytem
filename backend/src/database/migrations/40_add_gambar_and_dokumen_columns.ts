import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

export const up: Migration = async ({ context: queryInterface }) => {
    await queryInterface.addColumn('inv_produk', 'gambar', {
        type: DataTypes.STRING(500),
        allowNull: true,
    });
    await queryInterface.addColumn('inv_transaksi', 'dokumen', {
        type: DataTypes.JSONB,
        allowNull: true,
    });
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.removeColumn('inv_produk', 'gambar');
    await queryInterface.removeColumn('inv_transaksi', 'dokumen');
};
