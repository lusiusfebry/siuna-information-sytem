import { Request, Response, NextFunction } from 'express';
import opnameService from '../services/opname.service';

class OpnameController {
    async listSessions(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await opnameService.listSessions({
                gudang_id: req.query.gudang_id ? Number(req.query.gudang_id) : undefined,
                status: req.query.status as string | undefined,
            });
            res.json({ status: 'success', data: result });
        } catch (error) {
            next(error);
        }
    }

    async getSession(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await opnameService.getSession(Number(req.params.id));
            res.json({ status: 'success', data: result });
        } catch (error) {
            next(error);
        }
    }

    async createSession(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user?.id;
            const result = await opnameService.createSession(req.body, userId);
            res.status(201).json({ status: 'success', data: result });
        } catch (error) {
            next(error);
        }
    }

    async startSession(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user?.id;
            const result = await opnameService.startSession(Number(req.params.id), userId);
            res.json({ status: 'success', data: result, message: 'Sesi opname dimulai' });
        } catch (error) {
            next(error);
        }
    }

    async upsertDetail(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user?.id;
            const result = await opnameService.upsertDetail(Number(req.params.id), req.body, userId);
            res.json({ status: 'success', data: result });
        } catch (error) {
            next(error);
        }
    }

    async upsertSerial(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user?.id;
            const result = await opnameService.upsertSerial(Number(req.params.id), req.body, userId);
            res.json({ status: 'success', data: result });
        } catch (error) {
            next(error);
        }
    }

    async finishSession(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user?.id;
            const result = await opnameService.finishSession(Number(req.params.id), userId);
            res.json({ status: 'success', data: result, message: 'Input opname diselesaikan' });
        } catch (error) {
            next(error);
        }
    }

    async approveSession(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user?.id;
            const result = await opnameService.approveSession(Number(req.params.id), userId);
            res.json({ status: 'success', data: result, message: 'Sesi opname disetujui' });
        } catch (error) {
            next(error);
        }
    }

    async cancelSession(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user?.id;
            const result = await opnameService.cancelSession(Number(req.params.id), req.body?.reason, userId);
            res.json({ status: 'success', data: result, message: 'Sesi opname dibatalkan' });
        } catch (error) {
            next(error);
        }
    }

    async exportBeritaAcara(req: Request, res: Response, next: NextFunction) {
        try {
            const pdf = await opnameService.generateBeritaAcara(Number(req.params.id));
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="berita-acara-opname-${req.params.id}.pdf"`);
            res.send(pdf);
        } catch (error) {
            next(error);
        }
    }
}

export default new OpnameController();
