import { QueryInterface } from 'sequelize';
import { Migration } from '../umzug';

// Removes duplicate indexes/constraints created by overlapping earlier migrations:
//  - migration 12 created employees_<fk>_idx AND migration 20 re-added default-named
//    employees_<fk> indexes → two btree indexes per FK.
//  - the unique NIK constraint (employees_nik_key) coexists with a redundant plain
//    index employees_nomor_induk_karyawan.
//  - migration 27 added `code UNIQUE` then a changeColumn re-applied UNIQUE → a
//    second unique index (*_code_key1) on every master-data table.
// Dropping the redundant copies removes write amplification; the kept index/constraint
// still enforces the same rule.

const MASTER_TABLES = [
    'divisi', 'department', 'posisi_jabatan', 'kategori_pangkat', 'golongan',
    'sub_golongan', 'jenis_hubungan_kerja', 'tag', 'lokasi_kerja', 'status_karyawan',
];

const EMPLOYEE_DUP_INDEXES = [
    'employees_divisi_id',
    'employees_department_id',
    'employees_status_karyawan_id',
    'employees_nomor_induk_karyawan',
];

const dropIndex = async (qi: QueryInterface, name: string) => {
    await qi.sequelize.query(`DROP INDEX IF EXISTS "${name}";`);
};

const dropConstraint = async (qi: QueryInterface, table: string, name: string) => {
    await qi.sequelize.query(`ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${name}";`);
};

export const up: Migration = async ({ context: queryInterface }) => {
    // Employees: drop the plain duplicate indexes (keep *_idx and employees_nik_key).
    for (const idx of EMPLOYEE_DUP_INDEXES) {
        await dropIndex(queryInterface, idx);
    }

    // Master data: drop the duplicate *_code_key1 unique constraints (keep *_code_key).
    for (const table of MASTER_TABLES) {
        await dropConstraint(queryInterface, table, `${table}_code_key1`);
    }
};

export const down: Migration = async ({ context: queryInterface }) => {
    // Recreate the plain duplicate indexes on employees.
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "employees_divisi_id" ON "employees" ("divisi_id");');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "employees_department_id" ON "employees" ("department_id");');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "employees_status_karyawan_id" ON "employees" ("status_karyawan_id");');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "employees_nomor_induk_karyawan" ON "employees" ("nomor_induk_karyawan");');

    // Recreate the duplicate unique constraints on master data.
    for (const table of MASTER_TABLES) {
        await queryInterface.sequelize.query(
            `ALTER TABLE "${table}" ADD CONSTRAINT "${table}_code_key1" UNIQUE ("code");`
        );
    }
};
