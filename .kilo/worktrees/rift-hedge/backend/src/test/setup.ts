import sequelize from '../config/database';
import { migrator } from '../database/umzug';
import '../modules/hr/models/associations';

beforeAll(async () => {
    // Global setup
    try {
        await sequelize.authenticate();

        // Run migrations
        if (process.env.NODE_ENV === 'test' || process.env.RUN_MIGRATIONS === 'true') {
            console.log('Running test migrations...');
            const pending = await migrator.pending();
            console.log(`Found ${pending.length} pending migrations.`);
            if (pending.length > 0) {
                console.log('Pending migrations:', pending.map(m => m.name).join(', '));
            }
            await migrator.up();
            console.log('Test migrations completed.');
        }
    } catch (error) {
        console.error('Unable to connect to the database or run migrations:', error);
    }
});

afterAll(async () => {
    // Global teardown
    await sequelize.close();
});

// Mock Redis to prevent needing a live Redis instance for all unit tests
jest.mock('../shared/services/cache.service', () => ({
    __esModule: true,
    default: {
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue(true),
        del: jest.fn().mockResolvedValue(true),
        delPattern: jest.fn().mockResolvedValue(true),
        remember: jest.fn((key, ttl, callback) => callback()),
    },
}));
