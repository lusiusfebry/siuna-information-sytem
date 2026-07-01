import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

export const up: Migration = async ({ context: queryInterface }) => {
    // Add missing fields to employee_personal_info
    await queryInterface.addColumn('employee_personal_info', 'nomor_wa', {
        type: DataTypes.STRING(20),
        allowNull: true,
    });
    await queryInterface.addColumn('employee_personal_info', 'akun_sosmed', {
        type: DataTypes.STRING(255),
        allowNull: true,
    });
    await queryInterface.addColumn('employee_personal_info', 'kode_pos', {
        type: DataTypes.STRING(10),
        allowNull: true,
    });
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.removeColumn('employee_personal_info', 'nomor_wa');
    await queryInterface.removeColumn('employee_personal_info', 'akun_sosmed');
    await queryInterface.removeColumn('employee_personal_info', 'kode_pos');
};
