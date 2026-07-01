import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { UserCircleIcon, CameraIcon, XMarkIcon } from '@heroicons/react/24/solid';

interface PhotoUploadProps {
    value?: File | string | null;
    onChange: (file: File | null) => void;
    error?: string;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({ value, onChange, error }) => {
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        if (!value) {
            setPreview(null);
            return;
        }

        if (typeof value === 'string') {
            if (value.startsWith('/uploads')) {
                // If it's a relative path from uploads, prepend backend URL
                // We try to get origin from VITE_API_URL or fallback to localhost:3000
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
                try {
                    // Handle case where API_URL might be full URL or just path (though unlikely for env)
                    if (apiUrl.startsWith('http')) {
                        const url = new URL(apiUrl);
                        setPreview(`${url.origin}${value}`);
                    } else {
                        setPreview(`http://localhost:3000${value}`);
                    }
                } catch {
                    setPreview(`http://localhost:3000${value}`);
                }
            } else {
                setPreview(value);
            }
        } else if (value instanceof File) {
            const objectUrl = URL.createObjectURL(value);
            setPreview(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        }
    }, [value]);

    const onDrop = (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            onChange(acceptedFiles[0]);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/jpeg': [],
            'image/png': []
        },
        maxSize: 2 * 1024 * 1024, // 2MB
        multiple: false
    });

    const removePhoto = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(null);
    };

    return (
        <div className="flex flex-col items-center">
            <div
                {...getRootProps()}
                className={`relative group cursor-pointer w-32 h-32 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors
                    ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'}
                    ${error ? 'border-red-500' : ''}
                `}
            >
                <input {...getInputProps()} />

                {preview ? (
                    <>
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                            <CameraIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100" />
                        </div>
                        <button
                            type="button"
                            onClick={removePhoto}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 focus:outline-none"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center text-gray-400">
                        <UserCircleIcon className="w-16 h-16" />
                        <span className="text-xs mt-1 text-center px-2">Upload Foto</span>
                    </div>
                )}
            </div>
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
            <p className="text-xs text-gray-500 mt-2 text-center">
                Max 2MB. JPG, PNG
            </p>
        </div>
    );
};
