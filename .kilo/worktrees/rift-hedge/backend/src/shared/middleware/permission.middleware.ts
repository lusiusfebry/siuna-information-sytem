import { Request, Response, NextFunction } from 'express';
import { permissionService } from '../../modules/auth/services/permission.service';
import { Permission } from '../../modules/auth/models/Permission';

// Extend Express Request to include user permissions
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            permissions?: Permission[];
            departmentFilter?: number;
        }
    }
}

export const checkPermission = (resource: string, action: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // User is populated by authMiddleware
            const user = req.user;

            if (!user) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            // Optimization: If loaded in auth middleware, just check req.permissions
            // But we'll use service for consistency or if we want to cache/fetch freshly
            const hasAccess = await permissionService.hasPermission(user.id, resource, action);

            if (!hasAccess) {
                return res.status(403).json({
                    message: 'Akses ditolak: Anda tidak memiliki izin untuk melakukan tindakan ini.'
                });
            }

            next();
        } catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({ message: 'Internal Server Error during permission check' });
        }
    };
};

export const checkDepartmentAccess = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = req.user;
            if (!user) return next();

            // Only apply for managers (or roles that need filtering)
            // If superadmin/admin, skip filtering
            if (['superadmin', 'admin', 'staff'].includes(user.roleDetails?.name || '')) {
                return next();
            }

            if (user.roleDetails?.name === 'manager' && user.employee) {
                req.departmentFilter = user.employee.department_id;
            }

            // For regular employee, maybe restrict to self? handled by checkResourceOwnership usually

            next();
        } catch (error) {
            next(error);
        }
    };
};

export const checkResourceOwnership = (resourceType: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = req.user;
            if (!user) return next();

            // Skip for admins/staff
            if (['superadmin', 'admin', 'staff'].includes(user.roleDetails?.name || '')) {
                return next();
            }

            const resourceId = parseInt(req.params.id);
            if (isNaN(resourceId)) return next(); // Should be handled by route validation

            if (resourceType === 'employee') {
                // If manager, check if target is in dept permissions (already handled by service logic?)
                // If employee, check if self
                if (user.roleDetails?.name === 'employee') {
                    if (user.employee_id !== resourceId) {
                        return res.status(403).json({ message: 'Akses ditolak: Anda hanya dapat mengakses data Anda sendiri.' });
                    }
                }
                // If manager, we rely on checkDepartmentAccess filter OR distinct check?
                // Usually for GET /:id, we need explicit check.
                if (user.roleDetails?.name === 'manager') {
                    const canAccess = await permissionService.canAccessEmployee(user.id, resourceId);
                    if (!canAccess) {
                        return res.status(403).json({ message: 'Akses ditolak: Karyawan ini tidak berada di bawah departemen Anda.' });
                    }
                }
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};
