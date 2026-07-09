import dotenv from 'dotenv';
import path from 'path';

// Ensure the test env is loaded so we connect to bebang_test (not the dev DB).
process.env.NODE_ENV = 'test';
dotenv.config({ path: path.join(__dirname, '../../.env.test') });

// Imported after env is set so config/database picks up the test connection.
import sequelize from '../config/database';

/**
 * Jest globalSetup — runs ONCE before the whole test run.
 *
 * Wipes the bebang_test schema so every run starts from a clean slate. This
 * eliminates cross-run contamination (leftover master-data `code`/user rows from
 * a previously-failed suite that skipped its afterAll cleanup). The per-file
 * setup then re-applies all migrations on the fresh schema.
 */
export default async () => {
    try {
        await sequelize.authenticate();
        await sequelize.query('DROP SCHEMA IF EXISTS public CASCADE;');
        await sequelize.query('CREATE SCHEMA public;');
        // eslint-disable-next-line no-console
        console.log('[globalSetup] bebang_test schema reset (clean slate).');
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[globalSetup] Failed to reset test schema:', err);
        throw err;
    } finally {
        await sequelize.close();
    }
};
