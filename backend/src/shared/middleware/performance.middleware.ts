import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        if (duration > 1000) {
            console.warn(`⚠️ Slow request: ${req.method} ${req.path} - ${duration}ms`);
        }
    });

    next();
};
