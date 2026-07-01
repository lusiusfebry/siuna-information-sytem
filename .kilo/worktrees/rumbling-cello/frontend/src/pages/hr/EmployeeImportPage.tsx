
import React, { useState } from 'react';

import { ExcelUpload } from '../../components/hr/ExcelUpload';
import { ImportResult, ImportResultData } from '../../components/hr/ImportResult';
import { ImportProgress } from '../../components/hr/ImportProgress';
import { importService, ImportPreviewData } from '../../services/api/import.service';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const EmployeeImportPage: React.FC = () => {
    // Navigate removed
    const [activeStep, setActiveStep] = useState<'upload' | 'preview' | 'result'>('upload');
    const [isLoading, setIsLoading] = useState(false);

    // Data States
    const [previewData, setPreviewData] = useState<ImportPreviewData | null>(null);
    const [importResult, setImportResult] = useState<ImportResultData | null>(null);

    const handleFileSelect = async (file: File) => {
        setIsLoading(true);
        try {
            const data = await importService.uploadAndPreview(file);
            setPreviewData(data);
            setActiveStep('preview');
        } catch (error) {
            console.error('Preview error:', error);
            // safe access
            const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal memproses file. Pastikan format sesuai.';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImport = async () => {
        if (!previewData?.filePath) return;

        setIsLoading(true);
        try {
            const result = await importService.importEmployees(previewData.filePath);
            setImportResult(result);
            setActiveStep('result');
            toast.success('Proses import selesai');
        } catch (error) {
            console.error('Import error:', error);
            const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gagal melakukan import data.';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadReport = async () => {
        if (importResult?.errors && importResult.errors.length > 0) {
            try {
                await importService.downloadErrorReport(importResult.errors);
            } catch (error) {
                console.error('Download error:', error);
                toast.error('Gagal mengunduh laporan error');
            }
        }
    };

    const handleReset = () => {
        setPreviewData(null);
        setImportResult(null);
        setActiveStep('upload');
    };

    const steps = [
        { id: 'upload', name: 'Upload File' },
        { id: 'preview', name: 'Preview & Validasi' },
        { id: 'result', name: 'Hasil Import' }
    ];

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header / Wizard Steps */}
            <div className="mb-8">
                <nav aria-label="Progress">
                    <ol role="list" className="flex items-center">
                        {steps.map((step, stepIdx) => (
                            <li key={step.name} className={clsx(stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : '', 'relative')}>
                                {step.id === activeStep || steps.findIndex(s => s.id === activeStep) > stepIdx ? (
                                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                        <div className="h-0.5 w-full bg-primary-600" />
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                        <div className="h-0.5 w-full bg-gray-200" />
                                    </div>
                                )}
                                <a
                                    href="#"
                                    className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white hover:bg-gray-50"
                                >
                                    <div
                                        className={clsx(
                                            "h-8 w-8 rounded-full flex items-center justify-center ring-2 ring-offset-2",
                                            step.id === activeStep ? "bg-primary-600 ring-primary-600 text-white" :
                                                steps.findIndex(s => s.id === activeStep) > stepIdx ? "bg-primary-600 ring-primary-600 text-white" :
                                                    "bg-white ring-gray-300 text-gray-400"
                                        )}
                                    >
                                        <span className="text-xs font-bold">{stepIdx + 1}</span>
                                    </div>
                                </a>
                            </li>
                        ))}
                    </ol>
                </nav>
                <div className="mt-4">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {activeStep === 'upload' && 'Upload Data Karyawan'}
                        {activeStep === 'preview' && 'Preview Data'}
                        {activeStep === 'result' && 'Hasil Import'}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {activeStep === 'upload' && 'Unggah file Excel berisi data karyawan untuk diimport ke sistem.'}
                        {activeStep === 'preview' && `Menampilkan ${previewData?.headers.length || 0} kolom dan total ${previewData?.totalRows || 0} baris data.`}
                        {activeStep === 'result' && 'Ringkasan hasil proses import data.'}
                    </p>
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-white shadow rounded-lg p-6 min-h-[400px] relative">
                {isLoading && (
                    <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center rounded-lg">
                        <ImportProgress status={activeStep === 'preview' ? 'Menganalisis file Excel...' : 'Menyimpan data ke database...'} />
                    </div>
                )}

                {activeStep === 'upload' && (
                    <div className="max-w-xl mx-auto py-8">
                        <ExcelUpload
                            onFileSelect={handleFileSelect}
                            templateUrl="/template-karyawan.xlsx"
                            templateFileName="template-karyawan.xlsx"
                        />
                    </div>
                )}

                {activeStep === 'preview' && previewData && (
                    <div className="space-y-6">
                        {/* Mapping Info or Stats could go here */}
                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200 text-xs">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-medium text-gray-500 w-10">No</th>
                                        {previewData.headers.slice(0, 8).map((header, idx) => ( // Limit cols for preview
                                            <th key={idx} className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                                                {header}
                                            </th>
                                        ))}
                                        {previewData.headers.length > 8 && (
                                            <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">...</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {previewData.rows.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-4 py-2 text-gray-500">{String(row._rowNumber)}</td>
                                            {previewData.headers.slice(0, 8).map((header, hIdx) => (
                                                <td key={hIdx} className="px-4 py-2 text-gray-900 truncate max-w-[150px]">
                                                    {String(row[header] || '')}
                                                </td>
                                            ))}
                                            {previewData.headers.length > 8 && (
                                                <td className="px-4 py-2 text-gray-400">...</td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                            <button
                                onClick={handleReset}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleImport}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Mulai Import
                                <ArrowRightIcon className="ml-2 -mr-1 h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}

                {activeStep === 'result' && importResult && (
                    <ImportResult
                        result={importResult}
                        onDownloadReport={handleDownloadReport}
                        onReset={handleReset}
                    />
                )}
            </div>

            {activeStep !== 'upload' && !isLoading && activeStep !== 'result' && (
                <div className="mt-4 text-center">
                    <button
                        onClick={handleReset}
                        className="text-sm text-gray-500 hover:text-gray-900 flex items-center justify-center mx-auto"
                    >
                        <ArrowLeftIcon className="h-3 w-3 mr-1" />
                        Kembali ke Upload
                    </button>
                </div>
            )}
        </div>
    );
};

// Helper for clsx if not imported/available (since I had lint warnings about unused vars but now I assume usage)
function clsx(...classes: (string | boolean | undefined | null)[]) {
    return classes.filter(Boolean).join(' ');
}

export default EmployeeImportPage;
