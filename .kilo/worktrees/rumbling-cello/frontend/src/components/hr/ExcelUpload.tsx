
import React, { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { CloudArrowUpIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx'; // Check if clsx installed, package.json says yes

interface ExcelUploadProps {
    onFileSelect: (file: File) => void;
    accept?: string;
    maxSize?: number; // bytes
    templateUrl?: string;
    templateFileName?: string;
}

export const ExcelUpload: React.FC<ExcelUploadProps> = ({
    onFileSelect,
    // accept = '.xlsx, .xls', // Unused as we hardcode specific mimes below
    // Force HMR Update
    maxSize = 10 * 1024 * 1024, // 10MB
    templateUrl,
    templateFileName
}) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
        console.log('Drop event triggered');
        console.log('Accepted files:', acceptedFiles);
        console.log('Rejection details:', fileRejections);

        setError(null);
        if (fileRejections.length > 0) {
            const currentRejection = fileRejections[0];
            console.warn('File rejected:', currentRejection);

            if (currentRejection.errors[0].code === 'file-too-large') {
                setError(`Ukuran file terlalu besar. Maksimal ${(maxSize / 1024 / 1024).toFixed(0)}MB.`);
            } else if (currentRejection.errors[0].code === 'file-invalid-type') {
                setError(`Tipe file tidak valid. File: ${currentRejection.file.name} (${currentRejection.file.type}). Harap unggah file .xlsx`);
            } else {
                setError(currentRejection.errors[0].message);
            }
            return;
        }

        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            console.log('File accepted:', file.name);
            setSelectedFile(file);
        }
    }, [maxSize]);

    const checkAndUpload = () => {
        if (selectedFile) {
            console.log('Upload button clicked for:', selectedFile.name);
            onFileSelect(selectedFile);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
            // Add generic types that might be used by some OS/Browsers for .xlsx
            'application/octet-stream': ['.xlsx'],
            'application/zip': ['.xlsx']
        },
        maxSize,
        multiple: false
    });

    const removeFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedFile(null);
        setError(null);
    };

    return (
        <div className="w-full">
            {/* Version Indicator for Debugging */}
            <div className="mb-2 text-right">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    System Version: v3.0 (Manual Upload)
                </span>
            </div>

            <div
                {...getRootProps()}
                className={clsx(
                    "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ease-in-out",
                    isDragActive ? "border-primary-500 bg-primary-50" : "border-gray-300 hover:border-primary-400 hover:bg-gray-50",
                    error && "border-red-300 bg-red-50 hover:bg-red-50"
                )}
            >
                <input {...getInputProps()} />

                {selectedFile ? (
                    <div className="flex flex-col items-center">
                        <DocumentIcon className="h-12 w-12 text-primary-600 mb-3" />
                        <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center">
                        <CloudArrowUpIcon className={clsx("h-12 w-12 mb-3", error ? "text-red-400" : "text-gray-400")} />
                        <p className="text-sm font-bold text-gray-900 mb-1">
                            Klik area ini untuk memilih file Excel
                        </p>
                        <p className="text-xs text-gray-500">
                            Atau drop file di sini.
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                            Format: XLSX, XLS (Maks 10MB)
                        </p>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <p className="mt-2 text-sm text-red-600 font-medium text-center">
                    Error: {error}
                </p>
            )}

            {/* Action Buttons - Always Visible */}
            <div className="mt-6 flex justify-center space-x-4">
                {selectedFile && (
                    <button
                        onClick={removeFile}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                    >
                        <XMarkIcon className="h-5 w-5 mr-2 text-gray-500" />
                        Ganti File
                    </button>
                )}

                <button
                    onClick={(e) => {
                        e.preventDefault();
                        checkAndUpload();
                    }}
                    disabled={!selectedFile}
                    className={clsx(
                        "inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors",
                        selectedFile
                            ? "text-white bg-blue-600 hover:bg-blue-700 border-blue-600"
                            : "text-gray-400 bg-gray-200 cursor-not-allowed"
                    )}
                    style={{ opacity: 1, visibility: 'visible' }}
                >
                    <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                    Upload & Preview
                </button>
            </div>

            {templateUrl && !selectedFile && (
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500">
                        Belum punya template?{' '}
                        <a href={templateUrl} download={templateFileName || true} className="font-medium text-primary-600 hover:text-primary-500">
                            Download Template Excel
                        </a>
                    </p>
                </div>
            )}
        </div>
    );
};
