import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ArrowUpTrayIcon, XMarkIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { useUploadDocuments } from '../../hooks/useDocuments';
import clsx from 'clsx';

interface DocumentUploadProps {
    employeeId: number;
    documentType: string;
    label?: string;
    maxFiles?: number;
    onUploadSuccess?: () => void;
    description?: string;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
    employeeId,
    documentType,
    label,
    maxFiles = 5,
    onUploadSuccess
}) => {
    const [files, setFiles] = useState<File[]>([]);
    const [desc, setDesc] = useState('');
    const uploadMutation = useUploadDocuments();

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(prev => [...prev, ...acceptedFiles].slice(0, maxFiles));
    }, [maxFiles]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/jpeg': [],
            'image/png': [],
            'application/pdf': []
        },
        maxSize: 5 * 1024 * 1024, // 5MB
        maxFiles: maxFiles
    });

    const removeFile = (file: File) => {
        setFiles(files.filter(f => f !== file));
    };

    const handleUpload = async () => {
        if (files.length === 0) return;

        uploadMutation.mutate({
            employeeId,
            documentType,
            files,
            description: desc
        }, {
            onSuccess: () => {
                setFiles([]);
                setDesc('');
                if (onUploadSuccess) onUploadSuccess();
            }
        });
    };

    return (
        <div className="space-y-4">
            {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

            <div
                {...getRootProps()}
                className={clsx(
                    "mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-blue-500 transition-colors",
                    isDragActive && "border-blue-500 bg-blue-50"
                )}
            >
                <div className="space-y-1 text-center">
                    <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                        <input {...getInputProps()} />
                        <p className="pl-1">Upload file atau drag & drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                        PNG, JPG, PDF up to 5MB (Max {maxFiles} files)
                    </p>
                </div>
            </div>

            {files.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Selected Files:</h4>
                    <ul className="divide-y divide-gray-200 border rounded-md">
                        {files.map((file, idx) => (
                            <li key={idx} className="flex items-center justify-between py-2 pl-3 pr-4 text-sm">
                                <div className="flex w-0 flex-1 items-center">
                                    <DocumentIcon className="h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
                                    <span className="ml-2 w-0 flex-1 truncate">{file.name}</span>
                                    <span className="text-xs text-gray-500 ml-2">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                </div>
                                <div className="ml-4 flex flex-shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => removeFile(file)}
                                        className="font-medium text-red-600 hover:text-red-500"
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Tambahkan keterangan (opsional)"
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={handleUpload}
                            disabled={uploadMutation.isPending}
                            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400"
                        >
                            {uploadMutation.isPending ? 'Uploading...' : 'Upload Files'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
