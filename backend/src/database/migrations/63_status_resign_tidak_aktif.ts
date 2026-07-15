import { Migration } from '../umzug';

// INV-M02: a departing employee (status "Resign") must be flagged as an
// operationally inactive state so the asset-return guard can key off a stable
// master-data column instead of a hardcoded name. The status_karyawan master
// carries a `status` ENUM ('Aktif' | 'Tidak Aktif'); the "Resign" row was seeded
// as 'Aktif', so the guard (block deactivation while assets are still held) never
// had a signal to trigger on. Mark "Resign" as 'Tidak Aktif'.
//
// Idempotent + scoped: only touches the "Resign" row that is still 'Aktif', so
// re-running is a no-op and admin-managed statuses are left alone. If the business
// later adds other exit statuses (PHK, Pensiun), the admin flags them 'Tidak Aktif'
// via master data and the guard picks them up automatically — no code change.

export const up: Migration = async ({ context: queryInterface }) => {
    const q = queryInterface.sequelize;
    await q.query(`
        UPDATE "status_karyawan"
        SET "status" = 'Tidak Aktif', "updated_at" = NOW()
        WHERE "nama" = 'Resign' AND "status" = 'Aktif';
    `);
};

export const down: Migration = async ({ context: queryInterface }) => {
    const q = queryInterface.sequelize;
    await q.query(`
        UPDATE "status_karyawan"
        SET "status" = 'Aktif', "updated_at" = NOW()
        WHERE "nama" = 'Resign' AND "status" = 'Tidak Aktif';
    `);
};
