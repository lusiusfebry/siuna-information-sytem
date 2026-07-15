import { Request, Response, NextFunction } from 'express';
import stokService from '../services/stok.service';
import InvTransaksi from '../models/Transaksi';

class StokController {
    async getStok(req: Request, res: Response, next: NextFunction) {
        try {
            // Spread query first, then override with the middleware-set departmentFilter so a
            // client cannot spoof it via a query param; undefined for privileged roles (INV-M07).
            const result = await stokService.getStokList({ ...req.query, departmentFilter: req.departmentFilter });
            res.json({ status: 'success', ...result });
        } catch (error) {
            next(error);
        }
    }

    async getSerialNumbers(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await stokService.getSerialNumberList({ ...req.query, departmentFilter: req.departmentFilter });
            res.json({ status: 'success', ...result });
        } catch (error) {
            next(error);
        }
    }

    async createTransaksi(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user?.id;
            const result = await stokService.createTransaksi(req.body, userId);
            res.status(201).json({ status: 'success', data: result });
        } catch (error) {
            next(error);
        }
    }

    async getTransaksiList(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await stokService.getTransaksiList({ ...req.query, departmentFilter: req.departmentFilter });
            res.json({ status: 'success', ...result });
        } catch (error) {
            next(error);
        }
    }

    async getTransaksiDetail(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await stokService.getTransaksiDetail(Number(req.params.id), req.departmentFilter);
            res.json({ status: 'success', data: result });
        } catch (error) {
            next(error);
        }
    }

    async approveTransaksi(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user?.id;
            const result = await stokService.approveTransaksi(Number(req.params.id), userId);
            res.json({ status: 'success', data: result });
        } catch (error) {
            next(error);
        }
    }

    async rejectTransaksi(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user?.id;
            const result = await stokService.rejectTransaksi(Number(req.params.id), userId, req.body?.reason);
            res.json({ status: 'success', data: result });
        } catch (error) {
            next(error);
        }
    }

    async getKartuStok(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await stokService.getKartuStok({ ...req.query, departmentFilter: req.departmentFilter });
            res.json({ status: 'success', ...result });
        } catch (error) {
            next(error);
        }
    }

    async getFacilityInventory(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await stokService.getFacilityInventory(Number(req.params.buildingId));
            res.json({ status: 'success', data: result });
        } catch (error) {
            next(error);
        }
    }

    async uploadDokumen(req: Request, res: Response, next: NextFunction) {
        try {
            const transaksi = await InvTransaksi.findByPk(Number(req.params.id));
            if (!transaksi) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });

            const files = req.files as Express.Multer.File[];
            if (!files?.length) return res.status(400).json({ message: 'File dokumen harus diupload' });

            const existingDocs: any[] = transaksi.dokumen || [];
            const newDocs = files.map(f => ({
                nama: f.originalname,
                path: `/uploads/inventory/dokumen/${f.filename}`,
                size: f.size,
                mimetype: f.mimetype,
                uploaded_at: new Date().toISOString(),
            }));

            await transaksi.update({ dokumen: [...existingDocs, ...newDocs] });

            res.json({ status: 'success', data: { dokumen: [...existingDocs, ...newDocs] } });
        } catch (error) {
            next(error);
        }
    }
}

export default new StokController();
