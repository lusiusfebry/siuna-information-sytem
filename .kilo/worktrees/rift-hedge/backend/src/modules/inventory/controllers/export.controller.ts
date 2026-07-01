import { Request, Response, NextFunction } from 'express';
import exportService from '../services/export.service';

class ExportController {
    async exportStokExcel(req: Request, res: Response, next: NextFunction) {
        try {
            const buffer = await exportService.exportStokToExcel(req.query);
            const timestamp = new Date().toISOString().split('T')[0];
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=Stok-Inventaris-${timestamp}.xlsx`);
            res.send(buffer);
        } catch (error) {
            next(error);
        }
    }

    async exportStokPDF(req: Request, res: Response, next: NextFunction) {
        try {
            const buffer = await exportService.exportStokToPDF(req.query);
            const timestamp = new Date().toISOString().split('T')[0];
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Laporan-Stok-${timestamp}.pdf`);
            res.send(buffer);
        } catch (error) {
            next(error);
        }
    }
}

export default new ExportController();
