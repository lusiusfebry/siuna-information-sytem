import { Client } from 'pg';
import { env } from '../config/env';

const createDb = async () => {
    const client = new Client({
        user: env.db.user,
        host: env.db.host,
        database: 'postgres',
        password: env.db.password,
        port: env.db.port,
    });

    try {
        await client.connect();
        console.log('Connected to postgres database...');

        // Check if database exists
        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${env.db.name}'`);
        if (res.rowCount === 0) {
            console.log(`Creating database ${env.db.name}...`);
            await client.query(`CREATE DATABASE "${env.db.name}"`);
            console.log(`Database ${env.db.name} created successfully.`);
        } else {
            console.log(`Database ${env.db.name} already exists.`);
        }
    } catch (err) {
        console.error('Error creating database:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
};

createDb();
