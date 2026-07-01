
import apiClient from './client';

export interface QRCodeData {
    qrCode: string;
    nik: string;
    generatedAt?: string;
}

export const qrcodeService = {
    generateQRCode: async (nik: string): Promise<QRCodeData> => {
        // This is a placeholder as actual generation happens mostly on client or via generic endpoint
        return Promise.resolve({ qrCode: '', nik });
    },

    getEmployeeQRCode: async (employeeId: number) => {
        const response = await apiClient.get<{ success: boolean, data: QRCodeData }>(`/employees/${employeeId}/qrcode`);
        return response.data.data;
    }
};
