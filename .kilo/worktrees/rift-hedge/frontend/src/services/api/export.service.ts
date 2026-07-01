
import { EmployeeFilterParams } from '../../types/hr';
import apiClient from './client';

export const exportService = {
    exportEmployeesToExcel: async (filters: EmployeeFilterParams & { search?: string }) => {
        const response = await apiClient.get('/hr/employees/export/excel', {
            params: filters,
            responseType: 'blob',
            headers: {
                'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }
        });

        // Check if the response is actually JSON (error) despite blob type
        if (response.data.type === 'application/json') {
            const text = await response.data.text();
            try {
                const error = JSON.parse(text);
                throw new Error(error.message || 'Export failed');
            } catch (e) {
                // If parse fails, just throw original
                if (e instanceof Error && e.message !== 'Export failed') throw e;
            }
        }

        // Force octet-stream to ensure browser downloads it instead of trying to view it
        return new Blob([response.data], { type: 'application/octet-stream' });
    },

    exportEmployeeToPDF: async (employeeId: number) => {
        const response = await apiClient.get(`/hr/employees/${employeeId}/export/pdf`, {
            responseType: 'blob'
        });
        return response.data;
    },

    downloadFile: (blob: Blob, filename: string) => {
        try {
            // Create a temporary URL
            const url = window.URL.createObjectURL(blob);

            // Create hidden anchor and trigger click
            const link = document.createElement('a');
            link.style.display = 'none';
            link.href = url;
            link.download = filename; // This is the key property
            document.body.appendChild(link);

            console.log('[Export] Triggering download:', filename, 'Size:', blob.size);
            link.click();

            // Cleanup after delay
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                console.log('[Export] Cleanup done');
            }, 2000);
        } catch (error) {
            console.error('[Export] Download failed:', error);
            alert('Gagal mendownload file otomatis. Browser memblokir aksi ini.');
        }
    }
};
