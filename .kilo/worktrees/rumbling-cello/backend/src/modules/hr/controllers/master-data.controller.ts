import { Request, Response, NextFunction } from 'express';
import masterDataService from '../services/master-data.service';
import * as models from '../models';
import { Op } from 'sequelize';

class MasterDataController {
    private getModel(modelName: string) {
        // Map URL slug to Model Name
        const map: { [key: string]: string } = {
            'divisi': 'Divisi',
            'department': 'Department',
            'posisi-jabatan': 'PosisiJabatan',
            'kategori-pangkat': 'KategoriPangkat',
            'golongan': 'Golongan',
            'sub-golongan': 'SubGolongan',
            'jenis-hubungan-kerja': 'JenisHubunganKerja',
            'tag': 'Tag',
            'lokasi-kerja': 'LokasiKerja',
            'status-karyawan': 'StatusKaryawan'
        };

        // Normalize hyphen and underscore
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
            if (modelName === 'divisi') {
                include.push({ association: 'departments' });
            } else if (modelName === 'department') {
                include.push({ association: 'divisi' });
                include.push({ association: 'manager' });
            } else if (modelName === 'posisi-jabatan') {
                include.push({ association: 'department' });
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

            // Foreign Key Validation
            // Divisi validation for Department
            if (req.params.model === 'department' && req.body.divisi_id) {
                const divisi = await (models as any).Divisi.findByPk(req.body.divisi_id);
                if (!divisi) return res.status(400).json({ message: 'Divisi tidak ditemukan' });
            }
            // Manager validation for Department
            if (req.params.model === 'department' && req.body.manager_id) {
                // Assuming Employee model exists and is exported in models
                // Use safe check if model exists
                if ((models as any).Employee) {
                    const manager = await (models as any).Employee.findByPk(req.body.manager_id);
                    if (!manager) return res.status(400).json({ message: 'Manager tidak ditemukan' });
                }
            }
            // Department validation for PosisiJabatan
            if (req.params.model === 'posisi-jabatan' && req.body.department_id) {
                const dept = await (models as any).Department.findByPk(req.body.department_id);
                if (!dept) return res.status(400).json({ message: 'Department tidak ditemukan' });
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

            // Foreign Key Validation (Update)
            if (req.params.model === 'department' && req.body.divisi_id) {
                const divisi = await (models as any).Divisi.findByPk(req.body.divisi_id);
                if (!divisi) return res.status(400).json({ message: 'Divisi tidak ditemukan' });
            }
            if (req.params.model === 'department' && req.body.manager_id) {
                if ((models as any).Employee) {
                    const manager = await (models as any).Employee.findByPk(req.body.manager_id);
                    if (!manager) return res.status(400).json({ message: 'Manager tidak ditemukan' });
                }
            }
            if (req.params.model === 'posisi-jabatan' && req.body.department_id) {
                const dept = await (models as any).Department.findByPk(req.body.department_id);
                if (!dept) return res.status(400).json({ message: 'Department tidak ditemukan' });
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

    async getDepartmentsByDivisi(req: Request, res: Response, next: NextFunction) {
        try {
            const divisiId = parseInt(req.params.divisiId);
            const departments = await (models as any).Department.findAll({
                where: { divisi_id: divisiId }
            });
            res.json({ status: 'success', data: departments });
        } catch (error) {
            next(error);
        }
    }

    async getPosisiByDepartment(req: Request, res: Response, next: NextFunction) {
        try {
            const departmentId = parseInt(req.params.departmentId);
            const posisi = await (models as any).PosisiJabatan.findAll({
                where: { department_id: departmentId }
            });
            res.json({ status: 'success', data: posisi });
        } catch (error) {
            next(error);
        }
    }

    async getManagers(req: Request, res: Response, next: NextFunction) {
        try {
            const managers = await (models as any).Employee.findAll({
                include: [
                    {
                        model: (models as any).PosisiJabatan,
                        as: 'posisi_jabatan',
                        where: {
                            nama: {
                                [Op.iLike]: { [Op.any]: ['%head%', '%manager%', '%kepala%', '%direktur%', '%chief%'] }
                            }
                        }
                    },
                    {
                        model: (models as any).StatusKaryawan,
                        as: 'status_karyawan',
                        where: {
                            nama: { [Op.iLike]: 'aktif' }
                        }
                    }
                ]
            });
            res.json({ status: 'success', data: managers });
        } catch (error) {
            next(error);
        }
    }

    async getActiveEmployees(req: Request, res: Response, next: NextFunction) {
        try {
            const employees = await (models as any).Employee.findAll({
                include: [{
                    model: (models as any).StatusKaryawan,
                    as: 'status_karyawan',
                    where: {
                        nama: { [Op.iLike]: 'aktif' }
                    }
                }]
            });
            res.json({ status: 'success', data: employees });
        } catch (error) {
            next(error);
        }
    }
}

export default new MasterDataController();
