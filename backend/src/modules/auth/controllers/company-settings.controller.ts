import { Request, Response, NextFunction } from 'express';
import companySettingsService from '../services/company-settings.service';

class CompanySettingsController {
    async getSettings(req: Request, res: Response, next: NextFunction) {
        try {
            const settings: any = await companySettingsService.getSettings();

            // Anonymous callers get only public branding fields; contact PII and
            // internal metadata (address/phone/email/app_version) require auth.
            if (!(req as any).user && settings) {
                const s = settings.toJSON ? settings.toJSON() : settings;
                return res.json({
                    status: 'success',
                    data: {
                        id: s.id,
                        company_name: s.company_name,
                        company_short_name: s.company_short_name,
                        company_tagline: s.company_tagline,
                        logo_url: s.logo_url,
                        favicon_url: s.favicon_url,
                        footer_text: s.footer_text,
                    },
                });
            }

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
