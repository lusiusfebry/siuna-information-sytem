import { Request, Response, NextFunction } from 'express';
import labelService from '../services/label.service';

class LabelController {
    async getProductQR(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await labelService.generateProductQR(Number(req.params.id));
            res.json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    }

    async getSerialNumberQR(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await labelService.generateSerialNumberQR(Number(req.params.id));
            res.json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    }

    async getAssetTagQR(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await labelService.generateAssetTagQR(Number(req.params.id));
            res.json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    }

    async printLabels(req: Request, res: Response, next: NextFunction) {
        try {
            const { items } = req.body;
            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ status: 'error', message: 'Items harus diisi' });
            }
            const buffer = await labelService.generateLabelPDF(items);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=Label-Inventaris.pdf');
            res.send(buffer);
        } catch (error) {
            next(error);
        }
    }

    async lookupQR(req: Request, res: Response, next: NextFunction) {
        try {
            const code = req.query.code as string;
            if (!code) return res.status(400).json({ status: 'error', message: 'Parameter code harus diisi' });
            const data = await labelService.lookupQR(code);
            res.json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    }
}

export default new LabelController();
