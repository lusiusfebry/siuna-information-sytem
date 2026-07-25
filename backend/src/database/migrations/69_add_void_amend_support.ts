import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

// Void/Amend transaksi support (INV-N08).
//
// Void: mengubah status transaksi Pending ke 'Voided' — jejak (voided_by,
// voided_at, void_reason) dicatat di transaksi asli. Tidak ada efek stok.
//
// Amend: transaksi Approved dikoreksi lewat pasangan reversal + koreksi baru.
// - amends_transaksi_id ada di baris reversal/koreksi, menunjuk transaksi asli.
// - amended_by_transaksi_id ada di transaksi asli, menunjuk baris reversal.
//
// PostgreSQL ADD VALUE tidak bisa dijalankan dalam transaction block; umzug
// tidak membungkus migration dalam satu, jadi ini aman. IF NOT EXISTS menjaga
// idempotency (pola migration 39, 64, 68).
export const up: Migration = async ({ context: queryInterface }) => {
    const sequelize = queryInterface.sequelize;

    await sequelize.query(
        `ALTER TYPE "enum_inv_transaksi_approval_status" ADD VALUE IF NOT EXISTS 'Voided'`
    );

    await queryInterface.addColumn('inv_transaksi', 'voided_by', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('inv_transaksi', 'voided_at', {
        type: 'TIMESTAMPTZ' as any,
        allowNull: true,
    });

    await queryInterface.addColumn('inv_transaksi', 'void_reason', {
        type: DataTypes.TEXT,
        allowNull: true,
    });

    await queryInterface.addColumn('inv_transaksi', 'amends_transaksi_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'inv_transaksi', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('inv_transaksi', 'amended_by_transaksi_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'inv_transaksi', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    });

    await queryInterface.addIndex('inv_transaksi', ['amends_transaksi_id'], {
        name: 'idx_transaksi_amends',
    });
    await queryInterface.addIndex('inv_transaksi', ['amended_by_transaksi_id'], {
        name: 'idx_transaksi_amended_by',
    });
    // Partial index — raw query karena Sequelize queryInterface.addIndex
    // tidak mendukung WHERE clause secara reliable di semua versi.
    await sequelize.query(
        `CREATE INDEX idx_transaksi_voided_at ON inv_transaksi(voided_at) WHERE voided_at IS NOT NULL`
    );
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.removeIndex('inv_transaksi', 'idx_transaksi_voided_at');
    await queryInterface.removeIndex('inv_transaksi', 'idx_transaksi_amended_by');
    await queryInterface.removeIndex('inv_transaksi', 'idx_transaksi_amends');
    await queryInterface.removeColumn('inv_transaksi', 'amended_by_transaksi_id');
    await queryInterface.removeColumn('inv_transaksi', 'amends_transaksi_id');
    await queryInterface.removeColumn('inv_transaksi', 'void_reason');
    await queryInterface.removeColumn('inv_transaksi', 'voided_at');
    await queryInterface.removeColumn('inv_transaksi', 'voided_by');
    // PostgreSQL tidak mendukung DROP VALUE pada enum ('Voided' tetap ada).
};
