import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { documentService } from '../services/api/document.service';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

export const useEmployeeDocuments = (employeeId: number, documentType?: string) => {
    return useQuery({
        queryKey: ['documents', employeeId, documentType],
        queryFn: () => documentService.getEmployeeDocuments(employeeId, documentType),
        enabled: !!employeeId,
    });
};

export const useUploadDocuments = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            employeeId: number;
            documentType: string;
            files: File[];
            description?: string
        }) => documentService.uploadDocuments(
            data.employeeId,
            data.documentType,
            data.files,
            data.description
        ),
        onSuccess: (_, variables) => {
            toast.success('Dokumen berhasil diupload');
            queryClient.invalidateQueries({ queryKey: ['documents', variables.employeeId] });
        },
        onError: (error: AxiosError<{ message: string }>) => {
            toast.error(error.response?.data?.message || 'Gagal upload dokumen');
        }
    });
};

export const useDeleteDocument = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { employeeId: number; documentId: number }) =>
            documentService.deleteDocument(data.employeeId, data.documentId),
        onSuccess: (_, variables) => {
            toast.success('Dokumen berhasil dihapus');
            queryClient.invalidateQueries({ queryKey: ['documents', variables.employeeId] });
        },
        onError: (error: AxiosError<{ message: string }>) => {
            console.error('Delete error', error);
            toast.error(error.response?.data?.message || 'Gagal menghapus dokumen');
        }
    });
};

export const useDownloadDocument = () => {
    return useMutation({
        mutationFn: (data: { documentId: number; employeeId: number; fileName: string }) =>
            documentService.downloadDocument(data.documentId, data.employeeId, data.fileName),
        onError: () => {
            toast.error('Gagal download dokumen');
        }
    });
};
