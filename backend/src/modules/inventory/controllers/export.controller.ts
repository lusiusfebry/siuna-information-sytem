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

    async exportTransaksiExcel(req: Request, res: Response, next: NextFunction) {
        try {
            const buffer = await exportService.exportTransaksiToExcel(req.query);
            const timestamp = new Date().toISOString().split('T')[0];
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=Laporan-Transaksi-${timestamp}.xlsx`);
            res.send(buffer);
        } catch (error) {
            next(error);
        }
    }

    async exportTransaksiPDF(req: Request, res: Response, next: NextFunction) {
        try {
            const buffer = await exportService.exportTransaksiToPDF(req.query);
            const timestamp = new Date().toISOString().split('T')[0];
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Laporan-Transaksi-${timestamp}.pdf`);
            res.send(buffer);
        } catch (error) {
            next(error);
        }
    }

    async exportSerialNumberExcel(req: Request, res: Response, next: NextFunction) {
        try {
            const buffer = await exportService.exportSerialNumberToExcel(req.query);
            const timestamp = new Date().toISOString().split('T')[0];
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=Laporan-Aset-Serial-${timestamp}.xlsx`);
            res.send(buffer);
        } catch (error) {
            next(error);
        }
    }

    async exportSerialNumberPDF(req: Request, res: Response, next: NextFunction) {
        try {
            const buffer = await exportService.exportSerialNumberToPDF(req.query);
            const timestamp = new Date().toISOString().split('T')[0];
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Laporan-Aset-Serial-${timestamp}.pdf`);
            res.send(buffer);
        } catch (error) {
            next(error);
        }
    }

    async exportStokRendahExcel(req: Request, res: Response, next: NextFunction) {
        try {
            const buffer = await exportService.exportStokRendahToExcel(req.query);
            const timestamp = new Date().toISOString().split('T')[0];
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=Laporan-Stok-Rendah-${timestamp}.xlsx`);
            res.send(buffer);
        } catch (error) {
            next(error);
        }
    }

    async exportStokRendahPDF(req: Request, res: Response, next: NextFunction) {
        try {
            const buffer = await exportService.exportStokRendahToPDF(req.query);
            const timestamp = new Date().toISOString().split('T')[0];
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Laporan-Stok-Rendah-${timestamp}.pdf`);
            res.send(buffer);
        } catch (error) {
            next(error);
        }
    }

    async exportPergerakanExcel(req: Request, res: Response, next: NextFunction) {
        try {
            const buffer = await exportService.exportPergerakanToExcel(req.query);
            const timestamp = new Date().toISOString().split('T')[0];
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=Laporan-Pergerakan-${timestamp}.xlsx`);
            res.send(buffer);
        } catch (error) {
            next(error);
        }
    }

    async exportPergerakanPDF(req: Request, res: Response, next: NextFunction) {
        try {
            const buffer = await exportService.exportPergerakanToPDF(req.query);
            const timestamp = new Date().toISOString().split('T')[0];
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Laporan-Pergerakan-${timestamp}.pdf`);
            res.send(buffer);
        } catch (error) {
            next(error);
        }
    }
}

export default new ExportController();
