import { Request, Response, NextFunction } from 'express';
import dashboardService from '../services/dashboard.service';

class DashboardController {
    async getDashboardStats(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await dashboardService.getDashboardStats();
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    async getEmployeeDistribution(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await dashboardService.getEmployeeDistribution();
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    async getRecentActivities(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await dashboardService.getRecentActivities();
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    async getEmploymentStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await dashboardService.getEmploymentStatusDistribution();
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }
}

export default new DashboardController();
