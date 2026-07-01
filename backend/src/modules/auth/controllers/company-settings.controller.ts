import { Request, Response, NextFunction } from 'express';
import companySettingsService from '../services/company-settings.service';

class CompanySettingsController {
    async getSettings(req: Request, res: Response, next: NextFunction) {
        try {
            const settings = await companySettingsService.getSettings();
            res.json({ status: 'success', data: settings });
        } catch (error) {
            next(error);
        }
    }

    async updateSettings(req: Request, res: Response, next: NextFunction) {
        try {
            const settings = await companySettingsService.updateSettings(req.body);
            res.json({ status: 'success', data: settings, message: 'Pengaturan perusahaan berhasil diperbarui' });
        } catch (error) {
            next(error);
        }
    }

    async uploadLogo(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.file) {
                return res.status(400).json({ status: 'error', message: 'File logo harus diupload' });
            }
            const logoPath = `/uploads/company/${req.file.filename}`;
            const settings = await companySettingsService.updateLogo(logoPath);
            res.json({ status: 'success', data: settings, message: 'Logo berhasil diperbarui' });
        } catch (error) {
            next(error);
        }
    }
}

export default new CompanySettingsController();
