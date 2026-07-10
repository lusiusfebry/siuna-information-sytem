import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import User from '../models/User';
import { Role } from '../models/Role';
import Employee from '../../hr/models/Employee';
import { env } from '../../../config/env';

const isProd = env.nodeEnv === 'production';
const ACCESS_MAX_AGE = 15 * 60 * 1000; // 15 minutes
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// httpOnly cookies — inaccessible to JS (XSS-safe). SameSite=Lax works because
// the SPA and API are same-origin (Vite proxy in dev, nginx in prod).
const accessCookieOpts = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    maxAge: ACCESS_MAX_AGE,
    path: '/',
};
const refreshCookieOpts = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    maxAge: REFRESH_MAX_AGE,
    path: '/api/auth',
};

class AuthController {
    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { nik, password } = req.body;

            if (!nik || !password) {
                return res.status(400).json({ message: 'NIK and password are required' });
            }

            const { user, token, refreshToken } = await authService.login(nik, password);

            const fullUser = await User.findByPk(user.id, {
                include: [
                    { model: Employee, as: 'employee' },
                    { model: Role, as: 'roleDetails', include: ['permissions'] }
                ]
            });

            if (!fullUser) {
                return res.status(401).json({ message: 'User retrieval failed' });
            }

            // Set auth cookies (primary transport).
            res.cookie('access_token', token, accessCookieOpts);
            res.cookie('refresh_token', refreshToken, refreshCookieOpts);

            res.json({
                status: 'success',
                data: {
                    user: {
                        id: fullUser.id,
                        nik: fullUser.nik,
                        roleDetails: fullUser.roleDetails, // Use roleDetails, not role
                        employee: fullUser.employee
                    },
                    // Still returned in the body for backward-compat (curl/tests
                    // and the legacy Authorization-header path).
                    token
                }
            });
        } catch (error: any) {
            if (error.message === 'Invalid credentials') {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            next(error);
        }
    }

    // Mint a new access token from a valid refresh-token cookie, and rotate the
    // refresh cookie. Does not require the access token (it may be expired).
    async refresh(req: Request, res: Response, next: NextFunction) {
        try {
            const refreshToken = (req as any).cookies?.refresh_token;
            if (!refreshToken) {
                return res.status(401).json({ message: 'No refresh token' });
            }

            let decoded: any;
            try {
                decoded = authService.verifyRefreshToken(refreshToken);
            } catch {
                return res.status(401).json({ message: 'Invalid refresh token' });
            }

            const user = await User.findByPk(decoded.id, {
                include: [{ model: Role, as: 'roleDetails' }]
            });
            if (!user || (user as any).is_active === false) {
                return res.status(401).json({ message: 'User not found or inactive' });
            }

            // Revocation check: a refresh token is only valid while its embedded
            // token_version matches the user's current one. logout / password
            // change bumps token_version, invalidating all previously issued
            // refresh tokens (defends against reuse of a stolen/old token).
            if ((decoded.tv ?? 0) !== (user.token_version ?? 0)) {
                return res.status(401).json({ message: 'Refresh token telah dicabut' });
            }

            const newAccess = authService.generateToken(user);
            const newRefresh = authService.generateRefreshToken(user);
            res.cookie('access_token', newAccess, accessCookieOpts);
            res.cookie('refresh_token', newRefresh, refreshCookieOpts);

            res.json({ status: 'success', data: { token: newAccess } });
        } catch (error) {
            next(error);
        }
    }

    async me(req: Request, res: Response, next: NextFunction) {
        try {
            const decodedUser = (req as any).user;

            if (!decodedUser || !decodedUser.id) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const fullUser = await User.findByPk(decodedUser.id, {
                include: [
                    { model: Employee, as: 'employee' },
                    { model: Role, as: 'roleDetails', include: ['permissions'] }
                ]
            });

            if (!fullUser) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.json({
                status: 'success',
                data: {
                    user: {
                        id: fullUser.id,
                        nik: fullUser.nik,
                        roleDetails: fullUser.roleDetails,
                        employee: fullUser.employee
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async logout(req: Request, res: Response, next: NextFunction) {
        try {
            // Bump token_version so every refresh token issued before this logout
            // is rejected at /refresh (true server-side revocation, not just a
            // client cookie clear).
            const userId = (req as any).user?.id;
            if (userId) {
                await User.increment('token_version', { where: { id: userId } });
            }
            res.clearCookie('access_token', { path: '/' });
            res.clearCookie('refresh_token', { path: '/api/auth' });
            res.json({ status: 'success', message: 'Logged out successfully' });
        } catch (error) {
            next(error);
        }
    }
}

export default new AuthController();
