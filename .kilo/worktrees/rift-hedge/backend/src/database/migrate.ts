import { migrator } from './umzug';

const migrate = async () => {
    try {
        await migrator.up();
        console.log('Migrations executed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed', error);
        process.exit(1);
    }
};

migrate();
