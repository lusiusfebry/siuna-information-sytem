import { Request, Response, NextFunction } from 'express';
import auditService from '../services/audit.service';

class AuditController {
    async getAuditLogs(req: Request, res: Response, next: NextFunction) {
        try {
            const filters = {
                user_id: req.query.user_id ? parseInt(req.query.user_id as string) : undefined,
                entity_type: req.query.entity_type as string,
                entity_id: req.query.entity_id ? parseInt(req.query.entity_id as string) : undefined,
                action: req.query.action as any,
                date_from: req.query.date_from as string,
                date_to: req.query.date_to as string
            };

            const pagination = {
                page: req.query.page ? parseInt(req.query.page as string) : 1,
                limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
                sort_by: req.query.sort_by as string,
                sort_order: req.query.sort_order as 'ASC' | 'DESC'
            };

            const result = await auditService.getAuditLogs(filters, pagination);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async getAuditLogDetail(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id);
            const log = await auditService.getAuditLogById(id);
            if (!log) {
                return res.status(404).json({ message: 'Audit log not found' });
            }
            res.json({ data: log });
        } catch (error) {
            next(error);
        }
    }

    async getEntityHistory(req: Request, res: Response, next: NextFunction) {
        try {
            const { entityType, entityId } = req.params;
            const history = await auditService.getEntityHistory(entityType, parseInt(entityId));
            res.json({ data: history });
        } catch (error) {
            next(error);
        }
    }

    async getAuditStats(req: Request, res: Response, next: NextFunction) {
        try {
            const stats = await auditService.getAuditStats();
            res.json({ data: stats });
        } catch (error) {
            next(error);
        }
    }

    async getAuditUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const users = await auditService.getAuditUsers();
            res.json({ data: users });
        } catch (error) {
            next(error);
        }
    }
}

export default new AuditController();
