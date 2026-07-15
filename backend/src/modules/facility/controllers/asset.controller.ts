import { Request, Response, NextFunction } from 'express';
import assetService from '../services/asset.service';
import FacilityRoom from '../models/Room';
import { InvSerialNumber } from '../../inventory/models';

class FacilityAssetController {
    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await assetService.findAllWithFilter(req.query);
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
            const data = await assetService.findById(Number(req.params.id));
            if (!data) return res.status(404).json({ message: 'Asset tidak ditemukan' });
            res.json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const room = await FacilityRoom.findByPk(req.body.room_id);
            if (!room) return res.status(400).json({ message: 'Ruangan tidak ditemukan' });

            const sn = await InvSerialNumber.findByPk(req.body.serial_number_id);
            if (!sn) return res.status(400).json({ message: 'Serial number tidak ditemukan' });

            req.body.created_by = (req as any).user?.id || null;
            const data = await assetService.create(req.body);
            res.status(201).json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await assetService.update(Number(req.params.id), req.body);
            if (!data) return res.status(404).json({ message: 'Asset tidak ditemukan' });
            res.json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    }

    async withdraw(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user?.id || null;
            const data = await assetService.withdraw(Number(req.params.id), req.body, userId);
            if (!data) return res.status(404).json({ message: 'Asset tidak ditemukan' });
            res.json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    }
}

export default new FacilityAssetController();
