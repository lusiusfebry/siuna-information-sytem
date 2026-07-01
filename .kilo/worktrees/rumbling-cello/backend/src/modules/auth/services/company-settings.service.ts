import CompanySettings, { CompanySettingsAttributes } from '../models/CompanySettings';
import cacheService from '../../../shared/services/cache.service';

const CACHE_KEY = 'company_settings';
const CACHE_TTL = 3600;

class CompanySettingsService {
    async getSettings(): Promise<CompanySettingsAttributes> {
        return cacheService.remember<CompanySettingsAttributes>(CACHE_KEY, CACHE_TTL, async () => {
            const settings = await CompanySettings.findByPk(1);
            if (!settings) {
                const created = await CompanySettings.create({ id: 1 } as any);
                return created.toJSON();
            }
            return settings.toJSON();
        });
    }

    async updateSettings(data: Partial<CompanySettingsAttributes>): Promise<CompanySettingsAttributes> {
        const { id, created_at, updated_at, ...updateData } = data as any;
        await CompanySettings.update(updateData, { where: { id: 1 } });
        await cacheService.del(CACHE_KEY);
        const settings = await CompanySettings.findByPk(1);
        return settings!.toJSON();
    }

    async updateLogo(logoPath: string): Promise<CompanySettingsAttributes> {
        await CompanySettings.update({ logo_url: logoPath }, { where: { id: 1 } });
        await cacheService.del(CACHE_KEY);
        const settings = await CompanySettings.findByPk(1);
        return settings!.toJSON();
    }
}

export default new CompanySettingsService();
