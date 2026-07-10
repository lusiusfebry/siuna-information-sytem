import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

// Enable soft-delete (Sequelize `paranoid`) for employees and its child tables
// by adding a nullable `deleted_at` column. Previously these tables hard-deleted
// (FK CASCADE), permanently destroying personal/hr/family/document rows with no
// recovery. Master-data tables already work this way (migration 27).
//
// NIK reuse policy: NIK stays LOCKED after soft-delete (validateNIKUnique queries
// with paranoid:false), so the existing plain UNIQUE index on nomor_induk_karyawan
// is kept as-is (no partial index needed).

const TABLES = [
    'employees',
    'employee_personal_info',
    'employee_hr_info',
    'employee_family_info',
    'employee_documents',
];

export const up: Migration = async ({ context: queryInterface }) => {
    for (const table of TABLES) {
        await queryInterface.addColumn(table, 'deleted_at', {
            type: DataTypes.DATE,
            allowNull: true,
        });
    }
};

export const down: Migration = async ({ context: queryInterface }) => {
    for (const table of TABLES) {
        await queryInterface.removeColumn(table, 'deleted_at');
    }
};
