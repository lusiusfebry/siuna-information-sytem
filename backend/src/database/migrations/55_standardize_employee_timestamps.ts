import { Migration } from '../umzug';

// Standardize timestamp column naming to snake_case. `employees` and
// `employee_documents` were created with camelCase `createdAt`/`updatedAt` (via
// Sequelize defaults), while all other 40 tables use `created_at`/`updated_at`.
// This inconsistency breaks any raw SQL / reporting that assumes snake_case.
//
// The models keep their JS attribute names (`createdAt`/`updatedAt`) via a
// `field:` mapping, so application code (e.g. order: [['createdAt','DESC']]) is
// unaffected — only the physical column names change.

// Idempotent rename: only rename when the source column still exists and the
// target does not yet exist (safe on partial-apply / manual re-run).
const rename = async (qi: any, table: string, from: string, to: string) => {
    await qi.sequelize.query(`
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name = '${table}' AND column_name = '${from}')
               AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                               WHERE table_name = '${table}' AND column_name = '${to}')
            THEN
                ALTER TABLE "${table}" RENAME COLUMN "${from}" TO "${to}";
            END IF;
        END $$;
    `);
};

export const up: Migration = async ({ context: queryInterface }) => {
    await rename(queryInterface, 'employees', 'createdAt', 'created_at');
    await rename(queryInterface, 'employees', 'updatedAt', 'updated_at');
    await rename(queryInterface, 'employee_documents', 'createdAt', 'created_at');
    await rename(queryInterface, 'employee_documents', 'updatedAt', 'updated_at');
};

export const down: Migration = async ({ context: queryInterface }) => {
    await rename(queryInterface, 'employees', 'created_at', 'createdAt');
    await rename(queryInterface, 'employees', 'updated_at', 'updatedAt');
    await rename(queryInterface, 'employee_documents', 'created_at', 'createdAt');
    await rename(queryInterface, 'employee_documents', 'updated_at', 'updatedAt');
};
