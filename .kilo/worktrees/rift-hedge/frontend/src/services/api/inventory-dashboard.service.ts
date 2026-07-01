import client from './client';

export interface InventoryStats {
    totalProduk: number;
    totalStok: number;
    lowStockCount: number;
    asetDipinjam: number;
    transaksiBulanIni: number;
}

export interface StockByWarehouse {
    gudang_id: number;
    gudang_nama: string;
    total_stok: number;
}

export interface CategoryBreakdown {
    type: string;
    total_stok: number;
}

const getStats = async (): Promise<{ status: string; data: InventoryStats }> => {
    const response = await client.get('/inventory/dashboard/stats');
    return response.data;
};

const getStockByWarehouse = async (): Promise<{ status: string; data: StockByWarehouse[] }> => {
    const response = await client.get('/inventory/dashboard/stock-by-warehouse');
    return response.data;
};

const getCategoryBreakdown = async (): Promise<{ status: string; data: CategoryBreakdown[] }> => {
    const response = await client.get('/inventory/dashboard/category-breakdown');
    return response.data;
};

const getRecentTransactions = async (limit = 10) => {
    const response = await client.get('/inventory/dashboard/recent-transactions', { params: { limit } });
    return response.data;
};

const getLowStockItems = async () => {
    const response = await client.get('/inventory/dashboard/low-stock');
    return response.data;
};

export interface ItemVelocityItem {
    produk_id: number;
    produk_code: string;
    produk_nama: string;
    trx_count: number;
    total_qty: number;
    classification: 'Fast Moving' | 'Slow Moving' | 'Dead Stock';
}

export interface ItemVelocityData {
    period_days: number;
    fast_moving: ItemVelocityItem[];
    slow_moving: ItemVelocityItem[];
    dead_stock: ItemVelocityItem[];
    summary: { fast: number; slow: number; dead: number };
}

const getItemVelocity = async (days = 90): Promise<{ status: string; data: ItemVelocityData }> => {
    const response = await client.get('/inventory/dashboard/item-velocity', { params: { days } });
    return response.data;
};

const exportStokExcel = async (filters?: any): Promise<Blob> => {
    const response = await client.get('/inventory/export/stok/excel', { params: filters, responseType: 'blob' });
    return response.data;
};

const exportStokPDF = async (filters?: any): Promise<Blob> => {
    const response = await client.get('/inventory/export/stok/pdf', { params: filters, responseType: 'blob' });
    return response.data;
};

const inventoryDashboardService = {
    getStats,
    getStockByWarehouse,
    getCategoryBreakdown,
    getRecentTransactions,
    getLowStockItems,
    getItemVelocity,
    exportStokExcel,
    exportStokPDF,
};

export default inventoryDashboardService;
