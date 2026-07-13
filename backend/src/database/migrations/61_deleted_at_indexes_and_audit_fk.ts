import { Migration } from '../umzug';

// E-7: add a partial index on deleted_at for every paranoid table so recycle-bin
//      queries (WHERE deleted_at IS NOT NULL) don't scan the whole table. Partial
//      (only indexing soft-deleted rows) keeps the index tiny.
// G-4: audit_logs.user_id used onUpdate SET NULL (odd — every other FK uses
//      CASCADE). Realign to CASCADE for consistency.

const PARANOID_TABLES = [
    'department', 'divisi', 'employee_documents', 'employee_family_info',
    'employee_hr_info', 'employee_personal_info', 'employees', 'facility_buildings',
    'facility_maintenance_categories', 'facility_room_types', 'facility_rooms',
    'golongan', 'inv_brand', 'inv_gudang', 'inv_kategori', 'inv_produk',
    'inv_sub_kategori', 'inv_uom', 'jenis_hubungan_kerja', 'kategori_pangkat',
    'lokasi_kerja', 'posisi_jabatan', 'status_karyawan', 'sub_golongan', 'tag',
];

export const up: Migration = async ({ context: queryInterface }) => {
    const sequelize = queryInterface.sequelize;

    // E-7 — partial indexes on deleted_at
    for (const table of PARANOID_TABLES) {
        await sequelize.query(
            `CREATE INDEX IF NOT EXISTS "idx_${table}_deleted_at"
             ON "${table}" ("deleted_at") WHERE deleted_at IS NOT NULL`
        );
    }

    // G-4 — audit_logs.user_id FK onUpdate CASCADE (drop + re-add the FK).
    await sequelize.query(`
        DO $$
        DECLARE conname text;
        BEGIN
            SELECT con.conname INTO conname
            FROM pg_constraint con
            JOIN pg_class rel ON rel.oid = con.conrelid
            JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
            WHERE rel.relname = 'audit_logs' AND con.contype = 'f' AND att.attname = 'user_id'
            LIMIT 1;
            IF conname IS NOT NULL THEN
                EXECUTE format('ALTER TABLE audit_logs DROP CONSTRAINT %I', conname);
            END IF;
            ALTER TABLE audit_logs
                ADD CONSTRAINT audit_logs_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES users(id)
                ON UPDATE CASCADE ON DELETE SET NULL;
        END$$;
    `);
};

export const down: Migration = async ({ context: queryInterface }) => {
    const sequelize = queryInterface.sequelize;
    for (const table of PARANOID_TABLES) {
        await sequelize.query(`DROP INDEX IF EXISTS "idx_${table}_deleted_at"`);
    }
    // Leave the audit_logs FK as CASCADE on down (reverting to SET NULL is not
    // meaningful); no-op for that part.
};
