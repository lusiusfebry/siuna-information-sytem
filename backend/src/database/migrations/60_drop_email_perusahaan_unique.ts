import { Migration } from '../umzug';

// G-3: employees.email_perusahaan carried a legacy UNIQUE constraint
// (employees_email_key) inherited from the old `email` column that was renamed
// in migration 12. The Employee model does NOT declare this uniqueness and the
// app never validates it, so a second employee with the same company email
// fails with an unanticipated 23505. Company-email uniqueness is not a business
// rule here — drop the constraint to make the DB match the model.

export const up: Migration = async ({ context: queryInterface }) => {
    await queryInterface.sequelize.query(
        'ALTER TABLE "employees" DROP CONSTRAINT IF EXISTS "employees_email_key";'
    );
};

export const down: Migration = async ({ context: queryInterface }) => {
    // Re-add only if it does not already exist (NULLs are allowed by UNIQUE).
    await queryInterface.sequelize.query(`
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'employees_email_key'
            ) THEN
                ALTER TABLE "employees" ADD CONSTRAINT "employees_email_key" UNIQUE (email_perusahaan);
            END IF;
        END$$;
    `);
};
