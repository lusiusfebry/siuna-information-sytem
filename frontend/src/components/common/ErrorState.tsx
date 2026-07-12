import React from 'react';

interface ErrorStateProps {
    message?: string;
    onRetry?: () => void;
}

/** Shared inline error state for list queries — distinguishes a real fetch
 *  failure from an empty result (which should show an empty state instead). */
const ErrorState: React.FC<ErrorStateProps> = ({ message = 'Gagal memuat data. Periksa koneksi atau coba lagi.', onRetry }) => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="material-symbols-outlined text-5xl text-red-400 mb-3">error</span>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 max-w-sm">{message}</p>
        {onRetry && (
            <button
                onClick={onRetry}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                Coba Lagi
            </button>
        )}
    </div>
);

export default ErrorState;
