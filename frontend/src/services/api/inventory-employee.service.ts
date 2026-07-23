import client from './client';
import { InvSerialNumber, InvTransaksi } from '../../types/inventory';

interface EmployeeSearchResult {
    id: number;
    nama_lengkap: string;
    nomor_induk_karyawan: string;
}

export interface EmployeeWithAssets {
    id: number;
    nama_lengkap: string;
    nomor_induk_karyawan: string;
    asset_count: number;
}

const searchEmployees = async (query: string): Promise<{ status: string; data: EmployeeSearchResult[] }> => {
    const response = await client.get(`/inventory/employees/search`, { params: { q: query } });
    return response.data;
};

const getEmployeesWithAssets = async (q: string): Promise<{ status: string; data: EmployeeWithAssets[] }> => {
    const response = await client.get(`/inventory/employees/with-assets`, { params: { q } });
    return response.data;
};

const lookupAsset = async (identifier: string): Promise<{ status: string; data: InvSerialNumber | null }> => {
    const response = await client.get(`/inventory/assets/lookup`, { params: { identifier } });
    return response.data;
};

const getEmployeeAssets = async (employeeId: number): Promise<{ status: string; data: InvSerialNumber[] }> => {
    const response = await client.get(`/inventory/employees/${employeeId}/assets`);
    return response.data;
};

const getAssetHistory = async (employeeId: number): Promise<{ status: string; data: InvTransaksi[] }> => {
    const response = await client.get(`/inventory/employees/${employeeId}/asset-history`);
    return response.data;
};

const downloadBeritaAcara = async (employeeId: number, transaksiId?: number, arah: 'serah' | 'kembali' = 'serah'): Promise<Blob> => {
    const base = arah === 'kembali' ? 'berita-acara-retur' : 'berita-acara';
    const url = transaksiId
        ? `/inventory/employees/${employeeId}/${base}/${transaksiId}`
        : `/inventory/employees/${employeeId}/${base}`;
    const response = await client.get(url, { responseType: 'blob' });
    return response.data;
};

const inventoryEmployeeService = { searchEmployees, getEmployeesWithAssets, lookupAsset, getEmployeeAssets, getAssetHistory, downloadBeritaAcara };
export default inventoryEmployeeService;
