import { Migration } from '../umzug';

export const up: Migration = async ({ context: queryInterface }) => {
    await queryInterface.sequelize.query(
        `ALTER TYPE "enum_inv_transaksi_sub_tipe" ADD VALUE IF NOT EXISTS 'Ke Gedung/Mess'`
    );
    await queryInterface.sequelize.query(
        `ALTER TYPE "enum_inv_transaksi_sub_tipe" ADD VALUE IF NOT EXISTS 'Rusak/Terbuang'`
    );
};

export const down: Migration = async () => {
    // PostgreSQL does not support removing ENUM values
};
