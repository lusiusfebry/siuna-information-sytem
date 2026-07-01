import { Request, Response, NextFunction } from 'express';
// import logger from '../utils/logger'; 
import { env } from '../../config/env';

export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
    // logger.error(err.message, { stack: err.stack });
    console.error('Error caught in handler:', err.message);

    // Handle custom validation error thrown as Error with JSON string
    try {
        const parsed = JSON.parse(err.message);
        if (parsed.message && Array.isArray(parsed.errors)) {
            return res.status(400).json({
                status: 'error',
                message: parsed.message,
                errors: parsed.errors
            });
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_e) {
        // Not a JSON error, proceed
    }

    // Handle standard validation/business errors (non-JSON)
    if (err.statusCode) {
        return res.status(err.statusCode).json({
            status: 'error',
            message: err.message
        });
    }

    // Handle Foreign Key constraint errors
    if (
        err.name === 'SequelizeForeignKeyConstraintError' ||
        err.parent?.code === '23503' ||
        err.original?.code === '23503' ||
        err.parent?.code === '23001' ||
        err.original?.code === '23001'
    ) {
        return res.status(409).json({
            status: 'error',
            message: 'Tidak dapat menghapus atau mengubah data karena masih digunakan oleh data lain.'
        });
    }

    res.status(500).json({
        status: 'error',
        message: 'Internal Server Error',
        error: env.nodeEnv === 'development' ? err.message : undefined,
    });
};
