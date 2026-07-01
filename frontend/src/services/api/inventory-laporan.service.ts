import client from './client';

export interface LaporanStokFilters {
    gudang_id?: number;
}

export interface LaporanTransaksiFilters {
    tipe?: string;
    gudang_id?: number;
    tanggal_dari?: string;
    tanggal_sampai?: string;
}

export interface LaporanSerialNumberFilters {
    gudang_id?: number;
    status?: string;
}

export interface LaporanStokRendahFilters {
    gudang_id?: number;
}

export interface LaporanPergerakanFilters {
    days?: number;
}

const exportStokExcel = async (filters?: LaporanStokFilters): Promise<Blob> => {
    const response = await client.get('/inventory/export/stok/excel', { params: filters, responseType: 'blob' });
    return response.data;
};

const exportStokPDF = async (filters?: LaporanStokFilters): Promise<Blob> => {
    const response = await client.get('/inventory/export/stok/pdf', { params: filters, responseType: 'blob' });
    return response.data;
};

const exportTransaksiExcel = async (filters?: LaporanTransaksiFilters): Promise<Blob> => {
    const response = await client.get('/inventory/export/transaksi/excel', { params: filters, responseType: 'blob' });
    return response.data;
};

const exportTransaksiPDF = async (filters?: LaporanTransaksiFilters): Promise<Blob> => {
    const response = await client.get('/inventory/export/transaksi/pdf', { params: filters, responseType: 'blob' });
    return response.data;
};

const exportSerialNumberExcel = async (filters?: LaporanSerialNumberFilters): Promise<Blob> => {
    const response = await client.get('/inventory/export/serial-number/excel', { params: filters, responseType: 'blob' });
    return response.data;
};

const exportSerialNumberPDF = async (filters?: LaporanSerialNumberFilters): Promise<Blob> => {
    const response = await client.get('/inventory/export/serial-number/pdf', { params: filters, responseType: 'blob' });
    return response.data;
};

const exportStokRendahExcel = async (filters?: LaporanStokRendahFilters): Promise<Blob> => {
    const response = await client.get('/inventory/export/stok-rendah/excel', { params: filters, responseType: 'blob' });
    return response.data;
};

const exportStokRendahPDF = async (filters?: LaporanStokRendahFilters): Promise<Blob> => {
    const response = await client.get('/inventory/export/stok-rendah/pdf', { params: filters, responseType: 'blob' });
    return response.data;
};

const exportPergerakanExcel = async (filters?: LaporanPergerakanFilters): Promise<Blob> => {
    const response = await client.get('/inventory/export/pergerakan/excel', { params: filters, responseType: 'blob' });
    return response.data;
};

const exportPergerakanPDF = async (filters?: LaporanPergerakanFilters): Promise<Blob> => {
    const response = await client.get('/inventory/export/pergerakan/pdf', { params: filters, responseType: 'blob' });
    return response.data;
};

const inventoryLaporanService = {
    exportStokExcel,
    exportStokPDF,
    exportTransaksiExcel,
    exportTransaksiPDF,
    exportSerialNumberExcel,
    exportSerialNumberPDF,
    exportStokRendahExcel,
    exportStokRendahPDF,
    exportPergerakanExcel,
    exportPergerakanPDF,
};

export default inventoryLaporanService;
