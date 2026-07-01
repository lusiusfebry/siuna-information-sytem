import { Request, Response, NextFunction } from 'express';
import cacheService from '../services/cache.service';

export const cacheMiddleware = (ttl: number = 3600) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Skip caching for non-GET requests
        if (req.method !== 'GET') {
            return next();
        }

        const key = `cache:${req.originalUrl}`;

        try {
            const cached = await cacheService.get(key);
            if (cached) {
                return res.json(cached);
            }

            const originalJson = res.json.bind(res);
            res.json = (body: any) => {
                cacheService.set(key, body, ttl).catch(console.error);
                return originalJson(body);
            };

            next();
        } catch (error) {
            console.error('Cache middleware error:', error);
            next();
        }
    };
};
