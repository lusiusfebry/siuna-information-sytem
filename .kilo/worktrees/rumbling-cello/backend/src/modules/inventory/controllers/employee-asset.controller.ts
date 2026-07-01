import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import employeeAssetService from '../services/employee-asset.service';
import Employee from '../../hr/models/Employee';
import StatusKaryawan from '../../hr/models/StatusKaryawan';

class EmployeeAssetController {
    async searchEmployees(req: Request, res: Response, next: NextFunction) {
        try {
            const q = (req.query.q as string || '').trim();
            const where: any = {};

            if (q) {
                where[Op.or] = [
                    { nama_lengkap: { [Op.iLike]: `%${q}%` } },
                    { nomor_induk_karyawan: { [Op.iLike]: `%${q}%` } },
                ];
            }

            const employees = await Employee.findAll({
                where,
                include: [{
                    model: StatusKaryawan,
                    as: 'status_karyawan',
                    where: { nama: 'Aktif' },
                    attributes: [],
                }],
                attributes: ['id', 'nama_lengkap', 'nomor_induk_karyawan'],
                limit: 20,
                order: [['nama_lengkap', 'ASC']],
            });

            res.json({ status: 'success', data: employees });
        } catch (error) {
            next(error);
        }
    }

    async getAssets(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await employeeAssetService.getEmployeeAssets(Number(req.params.employeeId));
            res.json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    }

    async getHistory(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await employeeAssetService.getEmployeeAssetHistory(Number(req.params.employeeId));
            res.json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    }

    async downloadBeritaAcara(req: Request, res: Response, next: NextFunction) {
        try {
            const transaksiId = req.params.transaksiId ? Number(req.params.transaksiId) : undefined;
            const buffer = await employeeAssetService.generateBeritaAcara(Number(req.params.employeeId), transaksiId);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Berita-Acara-${req.params.employeeId}.pdf`);
            res.send(buffer);
        } catch (error) {
            next(error);
        }
    }
}

export default new EmployeeAssetController();
