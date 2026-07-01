import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { env } from './config/env';
import sequelize from './config/database';
import './modules/hr/models/associations'; // Import associations
import './modules/inventory/models/associations'; // Import inventory associations

const app = express();

// Middleware
import { performanceMonitor } from './shared/middleware/performance.middleware';
import { apiLimiter } from './shared/middleware/rate-limit.middleware';
app.use(performanceMonitor);
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: '10mb' })); // Limit request body size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
import hrRoutes from './modules/hr/routes/hr.routes';

app.get('/', (req, res) => {
    res.send('Bebang Sistem Informasi API Running');
});

app.use('/api/hr', hrRoutes);
import inventoryRoutes from './modules/inventory/routes/inventory.routes';
app.use('/api/inventory', inventoryRoutes);
import notificationRoutes from './shared/routes/notification.routes';
app.use('/api/notifications', notificationRoutes);
import authRoutes from './modules/auth/routes/auth.routes';
import roleRoutes from './modules/auth/routes/role.routes';
import userRoutes from './modules/auth/routes/user.routes';

app.use('/api/auth', authRoutes);
app.use('/api/auth', roleRoutes);
app.use('/api/auth', userRoutes);

import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from './config/swagger';

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err.stack);

    // Handle JSON string errors (Business Rule Validations)
    if (typeof err.message === 'string' && err.message.startsWith('{') && err.message.endsWith('}')) {
        try {
            const errorObj = JSON.parse(err.message);
            if (errorObj.message === 'Terjadi kesalahan validasi') {
                return res.status(400).json({
                    status: 'error',
                    message: errorObj.message,
                    errors: errorObj.errors,
                });
            }
        } catch {
            // Not a JSON string after all, continue to default
        }
    }

    // Handle Sequelize Foreign Key Errors
    if (
        err.name === 'SequelizeForeignKeyConstraintError' ||
        err.parent?.code === '23503' ||
        err.original?.code === '23503' ||
        err.parent?.code === '23001' ||
        err.original?.code === '23001'
    ) {
        return res.status(409).json({
            status: 'error',
            message: 'Tidak dapat menghapus atau mengubah data karena masih digunakan oleh data lain.',
            error: env.nodeEnv === 'development' ? err.message : undefined,
        });
    }

    // Handle errors with custom statusCode (e.g. from service layer)
    if (err.statusCode) {
        return res.status(err.statusCode).json({
            status: 'error',
            message: err.message,
        });
    }

    res.status(500).json({
        status: 'error',
        message: 'Internal Server Error',
        error: env.nodeEnv === 'development' ? err.message : undefined,
    });
});

// Database connection and server start
const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');

        // Initialize Scheduler
        try {
            const { initScheduler } = await import('./shared/utils/scheduler');
            initScheduler();
        } catch (schedErr) {
            console.error('Failed to initialize scheduler:', schedErr);
        }

        app.listen(env.port, async () => {
            console.log(`Server is running on port ${env.port}`);
            // Cache Warming
            try {
                const { default: cacheWarmingService } = await import('./shared/services/cache-warming.service');
                await cacheWarmingService.warmMasterDataCache();
            } catch (err) {
                console.error('Cache warming failed:', err);
            }
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

if (process.env.NODE_ENV !== 'test') {
    startServer();
}

export { app };
