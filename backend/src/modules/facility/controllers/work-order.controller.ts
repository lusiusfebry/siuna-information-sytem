import { Request, Response, NextFunction } from 'express';
import workOrderService from '../services/work-order.service';
import FacilityRoom from '../models/Room';
import FacilityMaintenanceCategory from '../models/MaintenanceCategory';
import { Employee } from '../../hr/models';

class FacilityWorkOrderController {
    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await workOrderService.findAllWithFilter(req.query);
            res.json({
                status: 'success',
                data: result.data,
                pagination: {
                    total: result.total,
                    page: result.page,
                    totalPages: result.totalPages
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async getOne(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await workOrderService.findById(Number(req.params.id));
            if (!data) return res.status(404).json({ message: 'Work order tidak ditemukan' });
            res.json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const room = await FacilityRoom.findByPk(req.body.room_id);
            if (!room) return res.status(400).json({ message: 'Ruangan tidak ditemukan' });

            if (req.body.kategori_id) {
                const kat = await FacilityMaintenanceCategory.findByPk(req.body.kategori_id);
                if (!kat) return res.status(400).json({ message: 'Kategori maintenance tidak ditemukan' });
            }

            if (req.body.assigned_to) {
                const emp = await Employee.findByPk(req.body.assigned_to);
                if (!emp) return res.status(400).json({ message: 'Assignee tidak ditemukan' });
            }

            req.body.created_by = (req as any).user?.id || null;
            const data = await workOrderService.create(req.body);
            res.status(201).json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            if (req.body.room_id) {
                const room = await FacilityRoom.findByPk(req.body.room_id);
                if (!room) return res.status(400).json({ message: 'Ruangan tidak ditemukan' });
            }
            if (req.body.kategori_id) {
                const kat = await FacilityMaintenanceCategory.findByPk(req.body.kategori_id);
                if (!kat) return res.status(400).json({ message: 'Kategori maintenance tidak ditemukan' });
            }
            if (req.body.assigned_to) {
                const emp = await Employee.findByPk(req.body.assigned_to);
                if (!emp) return res.status(400).json({ message: 'Assignee tidak ditemukan' });
            }

            const data = await workOrderService.update(Number(req.params.id), req.body);
            if (!data) return res.status(404).json({ message: 'Work order tidak ditemukan' });
            res.json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    }
}

export default new FacilityWorkOrderController();
