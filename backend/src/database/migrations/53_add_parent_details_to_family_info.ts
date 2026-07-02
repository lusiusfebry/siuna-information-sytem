import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

// Add detail fields for Bapak Kandung & Ibu Kandung (parents) to the
// employee_family_info table: tanggal_lahir, pendidikan_terakhir, pekerjaan,
// keterangan for each parent.
export const up: Migration = async ({ context: queryInterface }) => {
    // Bapak Kandung
    await queryInterface.addColumn('employee_family_info', 'tanggal_lahir_ayah_kandung', {
        type: DataTypes.DATEONLY,
        allowNull: true,
    });
    await queryInterface.addColumn('employee_family_info', 'pendidikan_terakhir_ayah_kandung', {
        type: DataTypes.STRING(100),
        allowNull: true,
    });
    await queryInterface.addColumn('employee_family_info', 'pekerjaan_ayah_kandung', {
        type: DataTypes.STRING(200),
        allowNull: true,
    });
    await queryInterface.addColumn('employee_family_info', 'keterangan_ayah_kandung', {
        type: DataTypes.TEXT,
        allowNull: true,
    });

    // Ibu Kandung
    await queryInterface.addColumn('employee_family_info', 'tanggal_lahir_ibu_kandung', {
        type: DataTypes.DATEONLY,
        allowNull: true,
    });
    await queryInterface.addColumn('employee_family_info', 'pendidikan_terakhir_ibu_kandung', {
        type: DataTypes.STRING(100),
        allowNull: true,
    });
    await queryInterface.addColumn('employee_family_info', 'pekerjaan_ibu_kandung', {
        type: DataTypes.STRING(200),
        allowNull: true,
    });
    await queryInterface.addColumn('employee_family_info', 'keterangan_ibu_kandung', {
        type: DataTypes.TEXT,
        allowNull: true,
    });
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.removeColumn('employee_family_info', 'tanggal_lahir_ayah_kandung');
    await queryInterface.removeColumn('employee_family_info', 'pendidikan_terakhir_ayah_kandung');
    await queryInterface.removeColumn('employee_family_info', 'pekerjaan_ayah_kandung');
    await queryInterface.removeColumn('employee_family_info', 'keterangan_ayah_kandung');
    await queryInterface.removeColumn('employee_family_info', 'tanggal_lahir_ibu_kandung');
    await queryInterface.removeColumn('employee_family_info', 'pendidikan_terakhir_ibu_kandung');
    await queryInterface.removeColumn('employee_family_info', 'pekerjaan_ibu_kandung');
    await queryInterface.removeColumn('employee_family_info', 'keterangan_ibu_kandung');
};
