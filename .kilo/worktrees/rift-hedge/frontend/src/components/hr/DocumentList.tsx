import React, { useState } from 'react';
import { EmployeeDocument } from '../../types/hr';
import { TrashIcon, ArrowDownTrayIcon, DocumentTextIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { useDeleteDocument, useDownloadDocument } from '../../hooks/useDocuments';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface DocumentListProps {
    documents: EmployeeDocument[];
    title?: string;
    employeeId: number;
}

export const DocumentList: React.FC<DocumentListProps> = ({ documents, title, employeeId }) => {
    const deleteMutation = useDeleteDocument();
    const downloadMutation = useDownloadDocument();
    const [previewDoc, setPreviewDoc] = useState<EmployeeDocument | null>(null);

    const handleDelete = (docId: number) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus dokumen ini?')) {
            deleteMutation.mutate({ employeeId, documentId: docId });
        }
    };

    const handleDownload = (docId: number, fileName: string) => {
        downloadMutation.mutate({ documentId: docId, employeeId, fileName });
    };

    if (documents.length === 0) {
        return (
            <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada dokumen</h3>
                <p className="mt-1 text-sm text-gray-500">Upload dokumen untuk menampilkannya di sini.</p>
            </div>
        );
    }

    return (
        <div className="mt-4">
            {title && <h4 className="text-md font-medium text-gray-700 mb-3">{title}</h4>}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {documents.map((doc) => (
                    <div key={doc.id} className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-gray-400">
                        <div className="flex-shrink-0">
                            {doc.mime_type === 'application/pdf' ? (
                                <DocumentTextIcon className="h-10 w-10 text-red-500" />
                            ) : (
                                <PhotoIcon className="h-10 w-10 text-green-500" />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <button onClick={() => setPreviewDoc(doc)} className="focus:outline-none text-left w-full">
                                <span className="absolute inset-0" aria-hidden="true" />
                                <p className="text-sm font-medium text-gray-900 truncate">{doc.file_name}</p>
                                <p className="truncate text-xs text-gray-500">
                                    {(doc.file_size / 1024).toFixed(0)} KB • {format(new Date(doc.createdAt), 'dd MMM yyyy', { locale: id })}
                                </p>
                                {doc.description && (
                                    <p className="truncate text-xs text-gray-400 mt-1">{doc.description}</p>
                                )}
                            </button>
                        </div>
                        <div className="flex-shrink-0 flex gap-2 z-10">
                            <button
                                onClick={() => handleDownload(doc.id, doc.file_name)}
                                className="p-1 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
                                title="Download"
                            >
                                <ArrowDownTrayIcon className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => handleDelete(doc.id)}
                                className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100"
                                title="Hapus"
                            >
                                <TrashIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <DocumentPreviewModal
                isOpen={!!previewDoc}
                onClose={() => setPreviewDoc(null)}
                documentId={previewDoc?.id || null}
                documentType={previewDoc?.mime_type || null}
                fileName={previewDoc?.file_name || ''}
                employeeId={employeeId}
            />
        </div>
    );
};
