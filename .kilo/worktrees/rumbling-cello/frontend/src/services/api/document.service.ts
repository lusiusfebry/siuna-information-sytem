import apiClient from './client';
import { EmployeeDocument } from '../../types/hr';

interface ApiResponse<T> {
    data: T;
    message?: string;
    status?: string;
}

export const documentService = {
    uploadDocuments: async (
        employeeId: number,
        documentType: string,
        files: File[],
        description?: string
    ): Promise<EmployeeDocument[]> => {
        const formData = new FormData();
        formData.append('document_type', documentType);
        if (description) {
            formData.append('description', description);
        }
        files.forEach(file => {
            formData.append('documents', file);
        });

        const response = await apiClient.post<{ data: EmployeeDocument[] }>(
            `/hr/employees/${employeeId}/documents`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }
        );
        return response.data.data;
    },

    getEmployeeDocuments: async (employeeId: number, type?: string): Promise<EmployeeDocument[]> => {
        const params: { type?: string } = {};
        if (type) params.type = type;

        const response = await apiClient.get<ApiResponse<EmployeeDocument[]>>(
            `/hr/employees/${employeeId}/documents`,
            { params }
        );
        return response.data.data;
    },

    deleteDocument: async (employeeId: number, documentId: number): Promise<void> => {
        await apiClient.delete(`/hr/employees/${employeeId}/documents/${documentId}`);
    },

    downloadDocument: async (documentId: number, employeeId: number, fileName: string) => {
        const response = await apiClient.get(`/hr/employees/${employeeId}/documents/${documentId}/download`, {
            responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },

    getPreviewUrl: (documentId: number, employeeId: number) => {
        // Return URL for direct usage in img src or iframe
        return `${apiClient.defaults.baseURL}/hr/employees/${employeeId}/documents/${documentId}/preview`;
    }
};
