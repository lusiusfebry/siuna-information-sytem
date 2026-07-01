import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

export const up: Migration = async ({ context: queryInterface }) => {
    await queryInterface.addColumn('inv_sub_kategori', 'prefix_tag', {
        type: DataTypes.STRING(100),
        allowNull: true,
    });
    await queryInterface.removeColumn('inv_kategori', 'prefix_tag');
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.addColumn('inv_kategori', 'prefix_tag', {
        type: DataTypes.STRING(100),
        allowNull: true,
    });
    await queryInterface.removeColumn('inv_sub_kategori', 'prefix_tag');
};
