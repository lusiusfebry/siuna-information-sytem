import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

export const up: Migration = async ({ context: queryInterface }) => {
    await queryInterface.addColumn('inv_serial_number', 'tag_number', {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true,
    });

    await queryInterface.changeColumn('inv_serial_number', 'serial_number', {
        type: DataTypes.STRING(100),
        allowNull: true,
    });
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.changeColumn('inv_serial_number', 'serial_number', {
        type: DataTypes.STRING(100),
        allowNull: false,
    });

    await queryInterface.removeColumn('inv_serial_number', 'tag_number');
};
