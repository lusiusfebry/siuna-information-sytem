import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

// The `email_perusahaan` column was inherited (renamed) from the legacy `email`
// column which was created NOT NULL. The Employee model and the create form both
// treat it as optional, so inserts without an email failed with a not-null
// constraint violation. This migration aligns the DB with the model.
export const up: Migration = async ({ context: queryInterface }) => {
    await queryInterface.changeColumn('employees', 'email_perusahaan', {
        type: DataTypes.STRING(100),
        allowNull: true,
    });
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.changeColumn('employees', 'email_perusahaan', {
        type: DataTypes.STRING(100),
        allowNull: false,
    });
};
