import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

// Consumable (barang habis pakai) support.
//
// A consumable is issued from a warehouse straight to an employee OR a division
// and is considered used on the way out — no serial/tag tracking, no return, no
// disposal. This adds:
//   - inv_produk.is_consumable: marks a product as habis-pakai (mutually exclusive
//     with has_serial_number/has_tag_number, enforced at the app layer).
//   - inv_transaksi.department_id: the receiving division when a consumable is
//     issued to a whole department instead of a single employee.
//   - sub_tipe 'Konsumsi': the outbound sub-type that only decrements warehouse
//     stock and records the recipient for reporting.
//
// PostgreSQL ADD VALUE is additive and cannot run inside a transaction block;
// umzug does not wrap migrations in one, so this is safe. IF NOT EXISTS keeps it
// idempotent (pattern of migrations 39 and 64).

export const up: Migration = async ({ context: queryInterface }) => {
    const sequelize = queryInterface.sequelize;

    await queryInterface.addColumn('inv_produk', 'is_consumable', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    });

    await queryInterface.addColumn('inv_transaksi', 'department_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'department', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    });

    await sequelize.query(
        `ALTER TYPE "enum_inv_transaksi_sub_tipe" ADD VALUE IF NOT EXISTS 'Konsumsi'`
    );

    await queryInterface.addIndex('inv_transaksi', ['department_id'], {
        name: 'idx_transaksi_department_id',
    });
    await queryInterface.addIndex('inv_produk', ['is_consumable'], {
        name: 'idx_produk_is_consumable',
    });
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.removeIndex('inv_produk', 'idx_produk_is_consumable');
    await queryInterface.removeIndex('inv_transaksi', 'idx_transaksi_department_id');
    await queryInterface.removeColumn('inv_transaksi', 'department_id');
    await queryInterface.removeColumn('inv_produk', 'is_consumable');
    // PostgreSQL does not support removing ENUM values ('Konsumsi' stays).
};
