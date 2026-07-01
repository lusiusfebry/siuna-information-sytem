import { Request, Response, NextFunction } from 'express';
import importService from '../services/import.service';
import fs from 'fs';

class InventoryImportController {
    async uploadAndPreview(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.file) return res.status(400).json({ message: 'File Excel harus diupload' });

            try {
                const { rows, headers } = await importService.parseExcelFile(req.file.path);
                res.json({
                    status: 'success',
                    data: {
                        headers,
                        rows: rows.slice(0, 20),
                        totalRows: rows.length,
                        filePath: req.file.path,
                    },
                });
            } catch (err: any) {
                return res.status(400).json({ message: err.message });
            }
        } catch (error) {
            next(error);
        }
    }

    async importProduk(req: Request, res: Response, next: NextFunction) {
        try {
            const { filePath } = req.body;
            if (!filePath || !fs.existsSync(filePath)) {
                return res.status(400).json({ message: 'File tidak ditemukan. Upload ulang.' });
            }

            const result = await importService.importProduk(filePath);

            try { fs.unlinkSync(filePath); } catch {}

            res.json({ status: 'success', data: result });
        } catch (error) {
            next(error);
        }
    }

    async importStokMasuk(req: Request, res: Response, next: NextFunction) {
        try {
            const { filePath } = req.body;
            if (!filePath || !fs.existsSync(filePath)) {
                return res.status(400).json({ message: 'File tidak ditemukan. Upload ulang.' });
            }

            const userId = (req as any).user?.id || 0;
            const result = await importService.importStokMasuk(filePath, userId);

            try { fs.unlinkSync(filePath); } catch {}

            res.json({ status: 'success', data: result });
        } catch (error) {
            next(error);
        }
    }

    async downloadErrorReport(req: Request, res: Response, next: NextFunction) {
        try {
            const { errors } = req.body;
            if (!errors || !Array.isArray(errors)) {
                return res.status(400).json({ message: 'Data error tidak valid' });
            }

            const buffer = await importService.generateErrorReport(errors);

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=error-report-${Date.now()}.xlsx`);
            res.send(buffer);
        } catch (error) {
            next(error);
        }
    }
}

export default new InventoryImportController();
