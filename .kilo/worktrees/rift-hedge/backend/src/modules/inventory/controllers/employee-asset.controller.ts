import { Request, Response, NextFunction } from 'express';
import employeeAssetService from '../services/employee-asset.service';

class EmployeeAssetController {
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
