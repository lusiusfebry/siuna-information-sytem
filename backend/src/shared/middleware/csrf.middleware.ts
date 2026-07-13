import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../../config/env';

const isProd = env.nodeEnv === 'production';
const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';
const CSRF_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // match refresh-token lifetime

// The CSRF cookie is intentionally NOT httpOnly — the SPA must read it to echo
// the value back in a request header (double-submit-cookie pattern). SameSite=Lax
// keeps it same-origin. Secure in production.
const csrfCookieOpts = {
    httpOnly: false,
    secure: isProd,
    sameSite: 'lax' as const,
    maxAge: CSRF_MAX_AGE,
    path: '/',
};

/** Issue a fresh CSRF token and set it as a readable cookie. Call on login/refresh. */
export const issueCsrfToken = (res: Response): string => {
    const token = crypto.randomBytes(32).toString('hex');
    res.cookie(CSRF_COOKIE, token, csrfCookieOpts);
    return token;
};

// Endpoints that establish the session and therefore run BEFORE a CSRF cookie
// exists. They are protected by credentials, not CSRF.
const EXEMPT_PATHS = ['/api/auth/login', '/api/auth/refresh'];

/**
 * Double-submit-cookie CSRF guard. For state-changing methods it requires the
 * X-CSRF-Token header to match the csrf_token cookie. A cross-site attacker can
 * neither read the victim's cookie (same-origin policy) nor set a custom header
 * via a simple form, so forged requests are rejected. Safe methods pass through.
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
    const method = req.method.toUpperCase();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
        return next();
    }
    if (EXEMPT_PATHS.includes(req.path) || EXEMPT_PATHS.includes(req.originalUrl.split('?')[0])) {
        return next();
    }

    // CSRF only applies to COOKIE-authenticated requests (a browser sends cookies
    // automatically). A request that authenticates via an Authorization: Bearer
    // header is not forgeable cross-site (an attacker cannot set custom headers),
    // so it is exempt — this also covers API clients and the test suite.
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return next();
    }

    const cookieToken = (req as any).cookies?.[CSRF_COOKIE];
    const headerToken = req.headers[CSRF_HEADER] as string | undefined;

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return res.status(403).json({ status: 'error', message: 'CSRF token tidak valid atau tidak ada' });
    }

    next();
};
