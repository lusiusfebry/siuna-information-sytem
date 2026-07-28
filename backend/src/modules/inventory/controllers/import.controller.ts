import { Request, Response, NextFunction } from 'express';
import importService from '../services/import.service';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Token → absolute path map; entries expire after 10 minutes
const fileTokens = new Map<string, { filePath: string; expiresAt: number }>();
const TOKEN_TTL_MS = 10 * 60 * 1000;

function storeFileToken(filePath: string): string {
    const token = crypto.randomUUID();
    fileTokens.set(token, { filePath, expiresAt: Date.now() + TOKEN_TTL_MS });
    return token;
}

function resolveFileToken(token: string): string | null {
    const entry = fileTokens.get(token);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) { fileTokens.delete(token); return null; }
    fileTokens.delete(token);
    return entry.filePath;
}

class InventoryImportController {
    async downloadTemplate(req: Request, res: Response, next: NextFunction) {
        try {
            const type = req.params.type as 'produk' | 'stok-masuk';
            if (!['produk', 'stok-masuk'].includes(type)) {
                return res.status(400).json({ message: 'Tipe template tidak valid. Gunakan: produk atau stok-masuk' });
            }

            const buffer = await importService.generateTemplate(type);

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=template-${type}-${Date.now()}.xlsx`);
            res.send(buffer);
        } catch (error) {
            next(error);
        }
    }

    async uploadAndPreview(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.file) return res.status(400).json({ message: 'File Excel harus diupload' });

            try {
                const { rows, headers } = await importService.parseExcelFile(req.file.path);
                const fileToken = storeFileToken(req.file.path);
                res.json({
                    status: 'success',
                    data: {
                        headers,
                        rows: rows.slice(0, 20),
                        totalRows: rows.length,
                        fileToken,
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
            const { fileToken } = req.body;
            const filePath = fileToken ? resolveFileToken(fileToken) : null;
            if (!filePath || !fs.existsSync(filePath)) {
                return res.status(400).json({ message: 'File tidak ditemukan atau token tidak valid. Upload ulang.' });
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
            const { fileToken } = req.body;
            const filePath = fileToken ? resolveFileToken(fileToken) : null;
            if (!filePath || !fs.existsSync(filePath)) {
                return res.status(400).json({ message: 'File tidak ditemukan atau token tidak valid. Upload ulang.' });
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
