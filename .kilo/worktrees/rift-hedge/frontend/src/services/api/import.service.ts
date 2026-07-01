
import apiClient from './client';

export interface ImportPreviewData {
    headers: string[];
    rows: Record<string, unknown>[]; // Better than any[]
    totalRows: number;
    mapping: Record<string, string>; // Better than any
    filePath: string;
}

export interface ImportResultData {
    success: number;
    failed: number;
    total: number;
    errors: { row: number; message: string; data?: unknown }[];
}


export const importService = {

    uploadAndPreview: async (file: File): Promise<ImportPreviewData> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post<{ data: ImportPreviewData }>('/hr/import/preview', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data.data;
    },

    importEmployees: async (filePath: string): Promise<ImportResultData> => {
        const response = await apiClient.post<{ data: ImportResultData }>('/hr/import/employees', { filePath });
        return response.data.data;
    },

    importMasterData: async (type: string, filePath: string) => {
        const response = await apiClient.post(`/hr/import/master-data/${type}`, { filePath });
        return response.data;
    },

    downloadErrorReport: async (errors: { row: number; message: string; data?: unknown }[]) => {
        const response = await apiClient.post('/hr/import/error-report', { errors }, {
            responseType: 'blob'
        });

        // Handle blob download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `error-report-${new Date().getTime()}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    }
};
