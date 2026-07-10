import { Request, Response, NextFunction } from 'express';
import authService from '../../modules/auth/services/auth.service';
import User from '../../modules/auth/models/User';
import { Role } from '../../modules/auth/models/Role';
import { Permission } from '../../modules/auth/models/Permission';
import Employee from '../../modules/hr/models/Employee';

// Extend Express Request interface locally if not done globally
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            user?: User; // Use the Sequelize User Model type
        }
    }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Primary: httpOnly access-token cookie. Fallback: Authorization header
        // (kept for curl/tests and backward compatibility during migration).
        const cookieToken = (req as any).cookies?.access_token;
        const authHeader = req.headers.authorization;
        const headerToken = authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.split(' ')[1]
            : undefined;
        const token = cookieToken || headerToken;

        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const decoded = authService.verifyToken(token) as any;

        // Fetch full user details including Role and Permissions (via Role)
        const user = await User.findByPk(decoded.id, {
            include: [
                {
                    model: Role,
                    as: 'roleDetails',
                    include: [{
                        model: Permission,
                        as: 'permissions',
                        through: { attributes: [] } // Exclude junction table attributes
                    }]
                },
                {
                    model: Employee,
                    as: 'employee'
                }
            ]
        });

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Reject tokens for deactivated accounts so disabling a user takes effect
        // immediately (before token expiry).
        if ((user as any).is_active === false) {
            return res.status(401).json({ message: 'Akun dinonaktifkan' });
        }

        // Attach user model instance to request
        req.user = user;

        // Also ensure role_id match if token had it? 
        // JWT usually has ID. We trust DB state.

        next();
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// Deprecated: Use permission middleware instead. keeping for backward compatibility if any
export const authorize = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = req.user;

        if (!user || !user.roleDetails || !roles.includes(user.roleDetails.name)) {
            // Check legacy role field if needed, but we migrated.
            return res.status(403).json({ message: 'Forbidden' });
        }

        next();
    };
};
