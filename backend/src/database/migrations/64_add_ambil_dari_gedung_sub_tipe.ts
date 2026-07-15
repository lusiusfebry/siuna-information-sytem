import { Migration } from '../umzug';

// INV-C01: introduce the return path for facility placements. Assets sent to a
// building via "Ke Gedung/Mess" previously had no transaction to bring them back
// to a warehouse. "Ambil dari Gedung" (an Inbound sub-type) is the mirror: it
// returns the serial to a warehouse, restores stock, and closes the matching
// facility_assets placement.
//
// PostgreSQL ADD VALUE is additive and cannot run inside a transaction block;
// umzug does not wrap migrations in one, so this is safe. IF NOT EXISTS keeps it
// idempotent. Follows the pattern of migration 39.

export const up: Migration = async ({ context: queryInterface }) => {
    await queryInterface.sequelize.query(
        `ALTER TYPE "enum_inv_transaksi_sub_tipe" ADD VALUE IF NOT EXISTS 'Ambil dari Gedung'`
    );
};

export const down: Migration = async () => {
    // PostgreSQL does not support removing ENUM values.
};
