import client from './client';
import { InvSerialNumber, InvTransaksi } from '../../types/inventory';

const getEmployeeAssets = async (employeeId: number): Promise<{ status: string; data: InvSerialNumber[] }> => {
    const response = await client.get(`/inventory/employee/${employeeId}/assets`);
    return response.data;
};

const getAssetHistory = async (employeeId: number): Promise<{ status: string; data: InvTransaksi[] }> => {
    const response = await client.get(`/inventory/employee/${employeeId}/asset-history`);
    return response.data;
};

const downloadBeritaAcara = async (employeeId: number, transaksiId?: number): Promise<Blob> => {
    const url = transaksiId
        ? `/inventory/employee/${employeeId}/berita-acara/${transaksiId}`
        : `/inventory/employee/${employeeId}/berita-acara`;
    const response = await client.get(url, { responseType: 'blob' });
    return response.data;
};

const inventoryEmployeeService = { getEmployeeAssets, getAssetHistory, downloadBeritaAcara };
export default inventoryEmployeeService;
