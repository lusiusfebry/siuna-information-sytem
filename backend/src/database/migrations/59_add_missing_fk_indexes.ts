import { Migration } from '../umzug';

// E-5: add indexes on foreign-key columns that are joined/filtered but were not
// indexed — inv_transaksi_detail.uom_id, inv_transaksi.gudang_tujuan_id,
// inv_transaksi.created_by. Uses IF NOT EXISTS so it is safe/idempotent.

const INDEXES: Array<{ name: string; table: string; column: string }> = [
    { name: 'idx_inv_transaksi_detail_uom_id', table: 'inv_transaksi_detail', column: 'uom_id' },
    { name: 'idx_inv_transaksi_gudang_tujuan_id', table: 'inv_transaksi', column: 'gudang_tujuan_id' },
    { name: 'idx_inv_transaksi_created_by', table: 'inv_transaksi', column: 'created_by' },
];

export const up: Migration = async ({ context: queryInterface }) => {
    for (const idx of INDEXES) {
        await queryInterface.sequelize.query(
            `CREATE INDEX IF NOT EXISTS "${idx.name}" ON "${idx.table}" ("${idx.column}")`
        );
    }
};

export const down: Migration = async ({ context: queryInterface }) => {
    for (const idx of INDEXES) {
        await queryInterface.sequelize.query(`DROP INDEX IF EXISTS "${idx.name}"`);
    }
};
