import { Request, Response, NextFunction } from 'express';
import notificationService from '../services/notification.service';

class NotificationController {
    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user?.id;
            const page = req.query.page ? Number(req.query.page) : 1;
            const limit = req.query.limit ? Number(req.query.limit) : 20;
            const result = await notificationService.getByUser(userId, page, limit);
            res.json({ status: 'success', ...result });
        } catch (error) {
            next(error);
        }
    }

    async getUnreadCount(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user?.id;
            const count = await notificationService.getUnreadCount(userId);
            res.json({ status: 'success', data: { count } });
        } catch (error) {
            next(error);
        }
    }

    async markAsRead(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user?.id;
            const notif = await notificationService.markAsRead(Number(req.params.id), userId);
            if (!notif) return res.status(404).json({ message: 'Notifikasi tidak ditemukan' });
            res.json({ status: 'success', data: notif });
        } catch (error) {
            next(error);
        }
    }

    async markAllAsRead(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user?.id;
            await notificationService.markAllAsRead(userId);
            res.json({ status: 'success', message: 'Semua notifikasi telah dibaca' });
        } catch (error) {
            next(error);
        }
    }
}

export default new NotificationController();
