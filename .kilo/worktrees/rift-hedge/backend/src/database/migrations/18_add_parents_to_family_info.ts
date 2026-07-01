import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

export const up: Migration = async ({ context: queryInterface }) => {

    await queryInterface.addColumn('employee_family_info', 'nama_ayah_kandung', {
        type: DataTypes.STRING(200),
        allowNull: true,
    });
    await queryInterface.addColumn('employee_family_info', 'nama_ibu_kandung', {
        type: DataTypes.STRING(200),
        allowNull: true,
    });
    await queryInterface.addColumn('employee_family_info', 'alamat_orang_tua', {
        type: DataTypes.TEXT,
        allowNull: true,
    });
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.removeColumn('employee_family_info', 'nama_ayah_kandung');
    await queryInterface.removeColumn('employee_family_info', 'nama_ibu_kandung');
    await queryInterface.removeColumn('employee_family_info', 'alamat_orang_tua');
};
