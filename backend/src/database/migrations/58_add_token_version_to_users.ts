import { DataTypes } from 'sequelize';
import { Migration } from '../umzug';

// B-4: refresh-token revocation. Add a per-user token_version that is embedded
// in each refresh token's claims. Bumping it (on logout / password change)
// invalidates every previously issued refresh token for that user.

export const up: Migration = async ({ context: queryInterface }) => {
    await queryInterface.addColumn('users', 'token_version', {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    });
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.removeColumn('users', 'token_version');
};
