
import React from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface ImportError {
    row: number;
    message: string;
    data?: unknown;
}

export interface ImportResultData {
    success: number;
    failed: number;
    total: number;
    errors: ImportError[];
}

interface ImportResultProps {
    result: ImportResultData;
    onDownloadReport?: () => void;
    onReset: () => void;
}

export const ImportResult: React.FC<ImportResultProps> = ({ result, onDownloadReport, onReset }) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-lg shadow border border-gray-100 flex flex-col items-center">
                    <span className="text-gray-500 text-sm font-medium">Total Data</span>
                    <span className="text-3xl font-bold text-gray-900 mt-2">{result.total}</span>
                </div>
                <div className="bg-green-50 p-6 rounded-lg shadow-sm border border-green-100 flex flex-col items-center">
                    <div className="flex items-center gap-2">
                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                        <span className="text-green-700 text-sm font-medium">Berhasil</span>
                    </div>
                    <span className="text-3xl font-bold text-green-700 mt-2">{result.success}</span>
                </div>
                <div className="bg-red-50 p-6 rounded-lg shadow-sm border border-red-100 flex flex-col items-center">
                    <div className="flex items-center gap-2">
                        <XCircleIcon className="h-5 w-5 text-red-600" />
                        <span className="text-red-700 text-sm font-medium">Gagal</span>
                    </div>
                    <span className="text-3xl font-bold text-red-700 mt-2">{result.failed}</span>
                </div>
            </div>

            {result.failed > 0 && (
                <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                        <h3 className="text-lg font-medium text-gray-900">Detail Validasi Gagal</h3>
                        {onDownloadReport && (
                            <button
                                onClick={onDownloadReport}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                                <ArrowDownTrayIcon className="h-4 w-4 mr-1 text-gray-500" />
                                Download Laporan Error
                            </button>
                        )}
                    </div>
                    <div className="overflow-x-auto max-h-96">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Baris (Excel)
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Pesan Error
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {result.errors.map((err, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                                            {err.row}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-red-600">
                                            {err.message}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="flex justify-end pt-4">
                <button
                    onClick={onReset}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                    Import File Lain
                </button>
            </div>
        </div>
    );
};
