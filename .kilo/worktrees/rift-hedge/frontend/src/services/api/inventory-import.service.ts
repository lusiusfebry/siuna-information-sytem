import client from './client';

export interface ImportPreviewData {
    headers: string[];
    rows: any[];
    totalRows: number;
    filePath: string;
}

export interface ImportResultData {
    success: number;
    failed: number;
    total: number;
    errors: { row: number; field?: string; message: string }[];
}

const uploadAndPreview = async (file: File): Promise<{ status: string; data: ImportPreviewData }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await client.post('/inventory/import/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

const importProduk = async (filePath: string): Promise<{ status: string; data: ImportResultData }> => {
    const response = await client.post('/inventory/import/produk', { filePath });
    return response.data;
};

const importStokMasuk = async (filePath: string): Promise<{ status: string; data: ImportResultData }> => {
    const response = await client.post('/inventory/import/stok-masuk', { filePath });
    return response.data;
};

const downloadErrorReport = async (errors: any[]): Promise<Blob> => {
    const response = await client.post('/inventory/import/error-report', { errors }, { responseType: 'blob' });
    return response.data;
};

const inventoryImportService = {
    uploadAndPreview,
    importProduk,
    importStokMasuk,
    downloadErrorReport,
};

export default inventoryImportService;
