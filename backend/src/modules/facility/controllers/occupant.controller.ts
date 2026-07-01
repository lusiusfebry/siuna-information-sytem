import { Request, Response, NextFunction } from 'express';
import occupantService from '../services/occupant.service';
import FacilityRoom from '../models/Room';
import { Employee } from '../../hr/models';

class FacilityOccupantController {
    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await occupantService.findAllWithFilter(req.query);
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
            const data = await occupantService.findById(Number(req.params.id));
            if (!data) return res.status(404).json({ message: 'Penghuni tidak ditemukan' });
            res.json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const room = await FacilityRoom.findByPk(req.body.room_id);
            if (!room) return res.status(400).json({ message: 'Ruangan tidak ditemukan' });

            const employee = await Employee.findByPk(req.body.employee_id);
            if (!employee) return res.status(400).json({ message: 'Karyawan tidak ditemukan' });

            req.body.created_by = (req as any).user?.id || null;
            const data = await occupantService.create(req.body);
            res.status(201).json({ status: 'success', data });
        } catch (error: any) {
            if (error.statusCode) {
                return res.status(error.statusCode).json({ message: error.message });
            }
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await occupantService.update(Number(req.params.id), req.body);
            if (!data) return res.status(404).json({ message: 'Penghuni tidak ditemukan' });
            res.json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    }

    async checkout(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await occupantService.checkout(Number(req.params.id), req.body);
            if (!data) return res.status(404).json({ message: 'Penghuni tidak ditemukan' });
            res.json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    }
}

export default new FacilityOccupantController();
