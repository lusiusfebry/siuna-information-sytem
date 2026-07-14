import { Migration } from '../umzug';

// Serial numbers identify a single physical asset unit and must be unique across
// the ENTIRE system, not just within one product. The original migration (37)
// created a composite unique index (produk_id, serial_number), which let two
// different products share the same serial (e.g. SN004 on both AC Daikin and
// Ac Polytron). Replace it with a partial unique index on serial_number alone.
//
// The index is PARTIAL (WHERE serial_number IS NOT NULL) so that tag-only
// products — which store rows with a NULL serial_number — can coexist without
// colliding on NULL.

export const up: Migration = async ({ context: queryInterface }) => {
    const q = queryInterface.sequelize;
    // Drop the old composite unique index and the redundant plain index.
    await q.query('DROP INDEX IF EXISTS "inv_serial_number_produk_id_serial_number";');
    await q.query('DROP INDEX IF EXISTS "inv_serial_number_serial_number";');
    // Global uniqueness for non-null serials.
    await q.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "inv_serial_number_serial_number_unique"
        ON "inv_serial_number" (serial_number)
        WHERE serial_number IS NOT NULL;
    `);
};

export const down: Migration = async ({ context: queryInterface }) => {
    const q = queryInterface.sequelize;
    await q.query('DROP INDEX IF EXISTS "inv_serial_number_serial_number_unique";');
    // Restore the original composite unique index + plain index from migration 37.
    await q.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "inv_serial_number_produk_id_serial_number"
        ON "inv_serial_number" (produk_id, serial_number);
    `);
    await q.query(`
        CREATE INDEX IF NOT EXISTS "inv_serial_number_serial_number"
        ON "inv_serial_number" (serial_number);
    `);
};
