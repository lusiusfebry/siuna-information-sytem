
import React from 'react';

interface ImportProgressProps {
    progress?: number; // 0-100 (Optional if logic uses indeterminate)
    status: string;
}

export const ImportProgress: React.FC<ImportProgressProps> = ({ progress, status }) => {
    return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Memproses Import</h3>
            <p className="text-gray-500 text-sm">{status}</p>
            {/* Optional Progress Bar */}
            {progress !== undefined && (
                <div className="w-full max-w-xs mt-4 bg-gray-200 rounded-full h-2.5">
                    <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
            )}
        </div>
    );
};
