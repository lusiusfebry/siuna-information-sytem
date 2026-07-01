import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import inventoryImportService, { ImportPreviewData, ImportResultData } from '../../services/api/inventory-import.service';
import Button from '../../components/common/Button';

type ImportType = 'produk' | 'stok-masuk';

const ImportPage = () => {
    const [importType, setImportType] = useState<ImportType>('produk');
    const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
    const [preview, setPreview] = useState<ImportPreviewData | null>(null);
    const [result, setResult] = useState<ImportResultData | null>(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        try {
            const res = await inventoryImportService.uploadAndPreview(file);
            setPreview(res.data);
            setStep('preview');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal membaca file');
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleImport = async () => {
        if (!preview?.filePath) return;
        setLoading(true);
        try {
            const importFn = importType === 'produk'
                ? inventoryImportService.importProduk
                : inventoryImportService.importStokMasuk;
            const res = await importFn(preview.filePath);
            setResult(res.data);
            setStep('result');
            if (res.data.failed === 0) toast.success(`Import berhasil: ${res.data.success} data`);
            else toast.error(`${res.data.failed} dari ${res.data.total} data gagal`);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal import data');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadErrors = async () => {
        if (!result?.errors?.length) return;
        try {
            const blob = await inventoryImportService.downloadErrorReport(result.errors);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `error-report-${Date.now()}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            toast.error('Gagal download error report');
        }
    };

    const reset = () => {
        setStep('upload');
        setPreview(null);
        setResult(null);
    };

    return (
        <div className="p-6 max-w-5xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Import Data Inventaris</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Import data produk atau stok dari file Excel</p>
            </div>

            {/* Import Type Selector */}
            {step === 'upload' && (
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 space-y-6">
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3 block">Tipe Import</label>
                        <div className="flex gap-3">
                            {[
                                { key: 'produk' as ImportType, label: 'Produk', desc: 'Import daftar produk baru', icon: 'category' },
                                { key: 'stok-masuk' as ImportType, label: 'Stok Masuk', desc: 'Import stok masuk ke gudang', icon: 'inventory_2' },
                            ].map((opt) => (
                                <button key={opt.key} type="button" onClick={() => setImportType(opt.key)}
                                    className={`flex-1 p-4 rounded-lg border-2 text-left transition-colors ${importType === opt.key ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <span className="material-symbols-outlined text-[24px] mb-2 block">{opt.icon}</span>
                                    <span className="text-sm font-semibold block">{opt.label}</span>
                                    <span className="text-xs text-gray-500">{opt.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3 block">Upload File Excel</label>
                        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleUpload} />
                        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={loading}
                            className="flex items-center gap-3 w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors disabled:opacity-50">
                            <span className="material-symbols-outlined text-[32px] text-gray-400">upload_file</span>
                            <div className="text-left">
                                <span className="text-sm font-medium text-gray-700 block">{loading ? 'Membaca file...' : 'Klik untuk upload file Excel'}</span>
                                <span className="text-xs text-gray-400">Format .xlsx, maksimal 10MB</span>
                            </div>
                        </button>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Format Kolom yang Diharapkan</h4>
                        {importType === 'produk' ? (
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                                <strong>Nama Produk</strong> (wajib), <strong>Brand</strong> (wajib, harus sesuai master data), Serial Number (Ya/Tidak), Stok Minimum, Keterangan
                            </p>
                        ) : (
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                                <strong>Kode Produk</strong> atau <strong>Nama Produk</strong> (wajib), <strong>UOM/Satuan</strong> (wajib), <strong>Gudang</strong> (wajib), <strong>Jumlah</strong> (wajib), Serial Number (koma-separated, opsional)
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Preview */}
            {step === 'preview' && preview && (
                <div className="space-y-4">
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Preview Data</h3>
                                <p className="text-xs text-gray-500 mt-1">Menampilkan {Math.min(20, preview.totalRows)} dari {preview.totalRows} baris</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={reset}>Batal</Button>
                                <Button size="sm" onClick={handleImport} isLoading={loading}>Import {preview.totalRows} Data</Button>
                            </div>
                        </div>

                        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-800">
                                        <th className="text-left px-3 py-2 font-medium text-gray-500 text-xs">#</th>
                                        {preview.headers.map((h: string) => (
                                            <th key={h} className="text-left px-3 py-2 font-medium text-gray-500 text-xs">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.rows.map((row: any, i: number) => (
                                        <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                                            <td className="px-3 py-2 text-xs text-gray-400">{row._rowNumber || i + 2}</td>
                                            {preview.headers.map((h: string) => (
                                                <td key={h} className="px-3 py-2 text-xs max-w-[200px] truncate">{row[h] || ''}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Result */}
            {step === 'result' && result && (
                <div className="space-y-4">
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Hasil Import</h3>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{result.total}</p>
                                <p className="text-xs text-gray-500">Total Data</p>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-green-600">{result.success}</p>
                                <p className="text-xs text-green-600">Berhasil</p>
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                                <p className="text-xs text-red-600">Gagal</p>
                            </div>
                        </div>

                        {result.errors.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-medium text-red-600">Detail Error</h4>
                                    <button type="button" onClick={handleDownloadErrors}
                                        className="flex items-center gap-1 text-xs text-primary hover:underline">
                                        <span className="material-symbols-outlined text-[14px]">download</span>
                                        Download Error Report
                                    </button>
                                </div>
                                <div className="overflow-x-auto border border-red-200 rounded-lg max-h-[300px] overflow-y-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-red-50 dark:bg-red-900/20 sticky top-0">
                                                <th className="text-left px-3 py-2 font-medium text-red-600 text-xs">Baris</th>
                                                <th className="text-left px-3 py-2 font-medium text-red-600 text-xs">Field</th>
                                                <th className="text-left px-3 py-2 font-medium text-red-600 text-xs">Pesan</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {result.errors.map((err, i) => (
                                                <tr key={i} className="border-t border-red-100">
                                                    <td className="px-3 py-2 text-xs">{err.row}</td>
                                                    <td className="px-3 py-2 text-xs">{err.field || '-'}</td>
                                                    <td className="px-3 py-2 text-xs text-red-600">{err.message}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div className="mt-6 flex gap-3">
                            <Button variant="outline" onClick={reset}>Import Lagi</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImportPage;
