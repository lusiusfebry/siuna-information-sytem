import { Request, Response, NextFunction } from 'express';
import masterDataService from '../services/master-data.service';
import * as models from '../models';
import { Employee } from '../../hr/models';
import LokasiKerja from '../../hr/models/LokasiKerja';

class FacilityMasterDataController {
    private getModel(modelName: string) {
        const map: { [key: string]: string } = {
            'building': 'FacilityBuilding',
            'room-type': 'FacilityRoomType',
            'room': 'FacilityRoom',
            'maintenance-category': 'FacilityMaintenanceCategory',
        };

        const normalizedKey = modelName.replace(/_/g, '-');
        const key = map[normalizedKey];
        return key ? (models as any)[key] : null;
    }

    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const modelName = req.params.model;
            const model = this.getModel(modelName);
            if (!model) return res.status(404).json({ message: 'Resource not found' });

            const include: any[] = [];
            if (modelName === 'building') {
                include.push({ association: 'lokasi_kerja' });
                include.push({ association: 'penanggung_jawab' });
            } else if (modelName === 'room') {
                include.push({ association: 'building' });
                include.push({ association: 'room_type' });
            }

            const result = await masterDataService.findAllWithFilter(model, req.query, include);

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
            const model = this.getModel(req.params.model);
            if (!model) return res.status(404).json({ message: 'Resource not found' });

            const data = await masterDataService.findById(model, Number(req.params.id));
            if (!data) return res.status(404).json({ message: 'Item not found' });

            res.json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const model = this.getModel(req.params.model);
            if (!model) return res.status(404).json({ message: 'Resource not found' });

            const normalizedModel = req.params.model.replace(/_/g, '-');

            // FK validation
            if (normalizedModel === 'building' && req.body.penanggung_jawab_id) {
                const employee = await Employee.findByPk(req.body.penanggung_jawab_id);
                if (!employee) return res.status(400).json({ message: 'Penanggung jawab tidak ditemukan' });
            }
            if (normalizedModel === 'building' && req.body.lokasi_kerja_id) {
                const lokasi = await LokasiKerja.findByPk(req.body.lokasi_kerja_id);
                if (!lokasi) return res.status(400).json({ message: 'Lokasi kerja tidak ditemukan' });
            }
            if (normalizedModel === 'room' && req.body.building_id) {
                const building = await (models as any).FacilityBuilding.findByPk(req.body.building_id);
                if (!building) return res.status(400).json({ message: 'Gedung tidak ditemukan' });
            }
            if (normalizedModel === 'room' && req.body.room_type_id) {
                const roomType = await (models as any).FacilityRoomType.findByPk(req.body.room_type_id);
                if (!roomType) return res.status(400).json({ message: 'Tipe kamar tidak ditemukan' });
            }

            const data = await masterDataService.create(model, req.body);
            res.status(201).json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const model = this.getModel(req.params.model);
            if (!model) return res.status(404).json({ message: 'Resource not found' });

            const normalizedModel = req.params.model.replace(/_/g, '-');

            if (normalizedModel === 'building' && req.body.penanggung_jawab_id) {
                const employee = await Employee.findByPk(req.body.penanggung_jawab_id);
                if (!employee) return res.status(400).json({ message: 'Penanggung jawab tidak ditemukan' });
            }
            if (normalizedModel === 'building' && req.body.lokasi_kerja_id) {
                const lokasi = await LokasiKerja.findByPk(req.body.lokasi_kerja_id);
                if (!lokasi) return res.status(400).json({ message: 'Lokasi kerja tidak ditemukan' });
            }
            if (normalizedModel === 'room' && req.body.building_id) {
                const building = await (models as any).FacilityBuilding.findByPk(req.body.building_id);
                if (!building) return res.status(400).json({ message: 'Gedung tidak ditemukan' });
            }
            if (normalizedModel === 'room' && req.body.room_type_id) {
                const roomType = await (models as any).FacilityRoomType.findByPk(req.body.room_type_id);
                if (!roomType) return res.status(400).json({ message: 'Tipe kamar tidak ditemukan' });
            }

            const data = await masterDataService.update(model, Number(req.params.id), req.body);
            if (!data) return res.status(404).json({ message: 'Item not found' });

            res.json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const model = this.getModel(req.params.model);
            if (!model) return res.status(404).json({ message: 'Resource not found' });

            const success = await masterDataService.delete(model, Number(req.params.id));
            if (!success) return res.status(404).json({ message: 'Item not found' });

            res.json({ status: 'success', message: 'Item archived successfully' });
        } catch (error) {
            next(error);
        }
    }

    async restore(req: Request, res: Response, next: NextFunction) {
        try {
            const model = this.getModel(req.params.model);
            if (!model) return res.status(404).json({ message: 'Resource not found' });

            const data = await masterDataService.restore(model, Number(req.params.id));
            if (!data) return res.status(404).json({ message: 'Item not found' });

            res.json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    }
}

export default new FacilityMasterDataController();
