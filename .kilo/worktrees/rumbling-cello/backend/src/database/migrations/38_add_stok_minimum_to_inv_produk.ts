import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

export const up: Migration = async ({ context: queryInterface }) => {
    await queryInterface.addColumn('inv_produk', 'stok_minimum', {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 5,
    });
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.removeColumn('inv_produk', 'stok_minimum');
};
