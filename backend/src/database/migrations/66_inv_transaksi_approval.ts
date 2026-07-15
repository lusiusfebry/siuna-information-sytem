import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

// INV-N07: approval workflow for inventory transactions.
//
// Scope decision: only 'Keluar' and 'Adjustment' transactions require approval
// (they remove or reconcile stock). 'Masuk' transactions are auto-approved.
//
// Stock treatment: a Pending transaction persists WITHOUT touching stock/serials;
// effects are replayed on approval. To replay faithfully we must remember the
// per-detail serial selection the submitter made — that lived only in the request
// payload before, so we snapshot it into inv_transaksi_detail.serial_numbers.
//
// Backfill: every existing transaction predates the workflow and already applied
// its effects, so it is 'Approved'. The column default is 'Approved' too, which
// keeps any code path that inserts without the field behaving as before.

export const up: Migration = async ({ context: queryInterface }) => {
    const sequelize = queryInterface.sequelize;

    await queryInterface.addColumn('inv_transaksi', 'approval_status', {
        type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
        allowNull: false,
        defaultValue: 'Approved',
    });

    await queryInterface.addColumn('inv_transaksi', 'approved_by', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('inv_transaksi', 'approved_at', {
        type: DataTypes.DATE,
        allowNull: true,
    });

    await queryInterface.addColumn('inv_transaksi', 'rejection_reason', {
        type: DataTypes.TEXT,
        allowNull: true,
    });

    // Serial/tag selection snapshot for pending replay. Null for legacy rows and
    // for details whose effects already ran.
    await queryInterface.addColumn('inv_transaksi_detail', 'serial_numbers', {
        type: DataTypes.JSONB,
        allowNull: true,
    });

    // Existing rows already applied their effects — mark them Approved explicitly
    // (belt-and-suspenders alongside the column default).
    await sequelize.query(`UPDATE inv_transaksi SET approval_status = 'Approved' WHERE approval_status IS NULL`);

    await queryInterface.addIndex('inv_transaksi', ['approval_status']);
};

export const down: Migration = async ({ context: queryInterface }) => {
    const sequelize = queryInterface.sequelize;

    await queryInterface.removeIndex('inv_transaksi', ['approval_status']);
    await queryInterface.removeColumn('inv_transaksi_detail', 'serial_numbers');
    await queryInterface.removeColumn('inv_transaksi', 'rejection_reason');
    await queryInterface.removeColumn('inv_transaksi', 'approved_at');
    await queryInterface.removeColumn('inv_transaksi', 'approved_by');
    await queryInterface.removeColumn('inv_transaksi', 'approval_status');

    // Drop the ENUM type Postgres created for the column (Sequelize leaves it behind).
    await sequelize.query('DROP TYPE IF EXISTS "enum_inv_transaksi_approval_status";');
};
