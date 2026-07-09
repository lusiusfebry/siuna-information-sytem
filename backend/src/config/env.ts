import dotenv from 'dotenv';
import path from 'path';

const envPath = process.env.NODE_ENV === 'test'
    ? path.join(__dirname, '../../.env.test')
    : path.join(__dirname, '../../.env');

dotenv.config({ path: envPath });

const isProd = process.env.NODE_ENV === 'production';

// Fail fast in production if critical secrets are missing or left at their
// insecure development defaults — a weak/guessable JWT secret allows token
// forgery (full auth bypass).
const WEAK_JWT_SECRETS = ['secret', 'your-secret-key-change-in-production'];
if (isProd) {
    const jwt = process.env.JWT_SECRET;
    if (!jwt || WEAK_JWT_SECRETS.includes(jwt) || jwt.length < 32) {
        throw new Error(
            'FATAL: JWT_SECRET must be set to a strong (>=32 char) value in production.'
        );
    }
    if (!process.env.DB_PASSWORD || process.env.DB_PASSWORD === '123456789') {
        throw new Error(
            'FATAL: DB_PASSWORD must be set to a non-default value in production.'
        );
    }
}

export const env = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        name: process.env.DB_NAME || 'bebang_db',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '123456789',
    },
    jwtSecret: process.env.JWT_SECRET || 'secret',
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    auditLogRetentionDays: parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '365', 10),
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || '0', 10),
        keyPrefix: process.env.REDIS_KEY_PREFIX || 'bebang:',
    },
};
