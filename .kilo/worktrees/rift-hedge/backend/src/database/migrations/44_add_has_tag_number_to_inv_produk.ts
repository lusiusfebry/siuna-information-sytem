import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

export const up: Migration = async ({ context: queryInterface }) => {
    await queryInterface.addColumn('inv_produk', 'has_tag_number', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    });
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.removeColumn('inv_produk', 'has_tag_number');
};
