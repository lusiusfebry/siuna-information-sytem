import client from './client';

export interface CompanySettings {
    id: number;
    company_name: string;
    company_short_name: string;
    company_legal_name: string;
    company_tagline: string;
    logo_url: string | null;
    favicon_url: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    app_version: string;
    footer_text: string | null;
}

const companySettingsService = {
    getSettings: async (): Promise<CompanySettings> => {
        const response = await client.get('/auth/company-settings');
        return response.data.data;
    },

    updateSettings: async (data: Partial<CompanySettings>): Promise<CompanySettings> => {
        const response = await client.put('/auth/company-settings', data);
        return response.data.data;
    },

    uploadLogo: async (file: File): Promise<CompanySettings> => {
        const formData = new FormData();
        formData.append('logo', file);
        const response = await client.post('/auth/company-settings/logo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data.data;
    },
};

export default companySettingsService;
