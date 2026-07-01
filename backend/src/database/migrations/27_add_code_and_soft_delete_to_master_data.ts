import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

const TABLES = [
    { name: 'divisi', prefix: 'DIV' },
    { name: 'department', prefix: 'DEP' },
    { name: 'posisi_jabatan', prefix: 'POS' },
    { name: 'kategori_pangkat', prefix: 'KAT' },
    { name: 'golongan', prefix: 'GOL' },
    { name: 'sub_golongan', prefix: 'SUB' },
    { name: 'jenis_hubungan_kerja', prefix: 'JHK' },
    { name: 'tag', prefix: 'TAG' },
    { name: 'lokasi_kerja', prefix: 'LOK' },
    { name: 'status_karyawan', prefix: 'STK' },
];

export const up: Migration = async ({ context: queryInterface }) => {
    for (const table of TABLES) {
        // Add code column (nullable first for backfill)
        await queryInterface.addColumn(table.name, 'code', {
            type: DataTypes.STRING(20),
            allowNull: true,
            unique: true,
        });

        // Add deleted_at column for soft delete
        await queryInterface.addColumn(table.name, 'deleted_at', {
            type: DataTypes.DATE,
            allowNull: true,
        });

        // Backfill existing rows with generated codes
        await queryInterface.sequelize.query(`
            WITH numbered AS (
                SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn
                FROM "${table.name}"
                WHERE code IS NULL
            )
            UPDATE "${table.name}" t
            SET code = '${table.prefix}-' || LPAD(CAST(n.rn AS TEXT), 4, '0')
            FROM numbered n
            WHERE t.id = n.id
        `);

        // Set code to NOT NULL after backfill
        await queryInterface.changeColumn(table.name, 'code', {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true,
        });
    }
};

export const down: Migration = async ({ context: queryInterface }) => {
    for (const table of TABLES) {
        await queryInterface.removeColumn(table.name, 'code');
        await queryInterface.removeColumn(table.name, 'deleted_at');
    }
};
