import rateLimit from 'express-rate-limit';
import { Request } from 'express';

/**
 * Rate Limiting Strategy for Production Environment
 * 
 * This configuration is designed for:
 * - 500+ concurrent users
 * - Future cloud deployment/scaling
 * - Corporate/enterprise usage
 * 
 * Strategy:
 * 1. Login: Strict (prevent brute force) - IP-based
 * 2. Authenticated API: Very loose - User-based
 * 3. Unauthenticated API: Moderate - IP-based
 */

/**
 * Key generator for user-based rate limiting
 * Uses user ID from JWT token if available, falls back to IP
 */
const userKeyGenerator = (req: Request): string => {
    // Extract user ID from authenticated request
    const user = (req as any).user;
    if (user && user.id) {
        return `user_${user.id}`;
    }
    // Fallback to IP for unauthenticated requests
    return req.ip || req.socket.remoteAddress || 'unknown';
};

/**
 * Rate limiter for authentication endpoints (login/register)
 * Strict limit to prevent brute force attacks
 * 
 * Limit: 10 login attempts per 15 minutes per IP
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per window
    message: {
        status: 'error',
        message: 'Terlalu banyak percobaan login, silakan coba lagi setelah 15 menit.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: false, // Disable validation to prevent IPv6 error
    // Use IP for auth endpoints (not logged in yet)
    keyGenerator: (req) => req.ip || req.socket.remoteAddress || 'unknown',
});

/**
 * Rate limiter for authenticated API endpoints
 * Very loose limit - designed for normal application usage
 * 
 * Limit: 10,000 requests per 15 minutes per user
 * This allows ~11 requests per second continuously
 */
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10000, // 10,000 requests per user per window
    message: {
        status: 'error',
        message: 'Terlalu banyak permintaan, silakan coba lagi nanti.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: false, // Disable validation to prevent IPv6 error
    // Use user ID for authenticated requests, IP as fallback
    keyGenerator: userKeyGenerator,
    // Skip rate limiting for successful requests (optional - comment out if you want strict limiting)
    skip: (_req) => {
        // Skip rate limiting in development
        if (process.env.NODE_ENV === 'development') {
            return true;
        }
        return false;
    },
});

/**
 * Rate limiter for sensitive mutation operations (create, update, delete)
 * Moderate limit to prevent abuse
 * 
 * Limit: 100 mutation requests per minute per user
 */
export const mutationLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 mutations per minute
    message: {
        status: 'error',
        message: 'Terlalu banyak operasi perubahan data, silakan tunggu sebentar.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: false, // Disable validation to prevent IPv6 error
    keyGenerator: userKeyGenerator,
});

/**
 * Rate limiter for public/unauthenticated endpoints
 * Moderate limit per IP
 * 
 * Limit: 500 requests per 15 minutes per IP
 */
export const publicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // 500 requests per IP
    message: {
        status: 'error',
        message: 'Terlalu banyak permintaan dari alamat ini, silakan coba lagi nanti.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
