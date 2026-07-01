import { Router } from 'express';
import notificationController from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', (req, res, next) => notificationController.getAll(req, res, next));
router.get('/unread-count', (req, res, next) => notificationController.getUnreadCount(req, res, next));
router.put('/:id/read', (req, res, next) => notificationController.markAsRead(req, res, next));
router.put('/read-all', (req, res, next) => notificationController.markAllAsRead(req, res, next));

export default router;
