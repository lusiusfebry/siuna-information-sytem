import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useCompanySettings, useUpdateCompanySettings, useUploadCompanyLogo } from '../../hooks/useCompanySettings';
import type { CompanySettings } from '../../services/api/company-settings.service';

const CompanySettingsPage = () => {
    const { data: settings, isLoading } = useCompanySettings();
    const updateMutation = useUpdateCompanySettings();
    const uploadLogoMutation = useUploadCompanyLogo();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    const { register, handleSubmit, reset } = useForm<Partial<CompanySettings>>();

    const [formReady, setFormReady] = useState(false);
    if (settings && !formReady) {
        reset(settings);
        setFormReady(true);
    }

    const onSubmit = (data: Partial<CompanySettings>) => {
        updateMutation.mutate(data, {
            onSuccess: () => toast.success('Pengaturan perusahaan berhasil disimpan'),
            onError: () => toast.error('Gagal menyimpan pengaturan'),
        });
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLogoPreview(URL.createObjectURL(file));
        uploadLogoMutation.mutate(file, {
            onSuccess: () => { toast.success('Logo berhasil diperbarui'); setLogoPreview(null); },
            onError: () => toast.error('Gagal mengupload logo'),
        });
    };

    const inputClass = 'w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all';
    const labelClass = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5';

    if (isLoading) {
        return (
            <div className="p-6 space-y-6">
                <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
                <div className="bg-white rounded-xl p-8 space-y-6">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="space-y-2 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-1/4" />
                            <div className="h-10 bg-gray-200 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
    const currentLogo = logoPreview || (settings?.logo_url ? `${apiBase}${settings.logo_url}` : null);

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pengaturan Perusahaan</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Kelola identitas dan branding perusahaan</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Logo Section */}
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Logo Perusahaan</h2>
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-800">
                            {currentLogo ? (
                                <img src={currentLogo} alt="Logo" className="w-full h-full object-contain p-2" />
                            ) : (
                                <span className="material-symbols-outlined text-4xl text-gray-300">image</span>
                            )}
                        </div>
                        <div>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadLogoMutation.isPending}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-[18px]">upload</span>
                                {uploadLogoMutation.isPending ? 'Mengupload...' : 'Upload Logo'}
                            </button>
                            <p className="text-xs text-gray-400 mt-1.5">JPG, PNG. Maksimal 2MB.</p>
                            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/jpg" onChange={handleLogoChange} className="hidden" />
                        </div>
                    </div>
                </div>

                {/* Identity Section */}
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Identitas Perusahaan</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className={labelClass}>Nama Perusahaan</label>
                            <input {...register('company_name')} className={inputClass} placeholder="Contoh: Bebang Sistem Informasi" />
                        </div>
                        <div>
                            <label className={labelClass}>Nama Singkat</label>
                            <input {...register('company_short_name')} className={inputClass} placeholder="Contoh: BIS" />
                        </div>
                        <div>
                            <label className={labelClass}>Nama Badan Hukum</label>
                            <input {...register('company_legal_name')} className={inputClass} placeholder="Contoh: PT Prima Sarana Gemilang" />
                        </div>
                        <div>
                            <label className={labelClass}>Tagline</label>
                            <input {...register('company_tagline')} className={inputClass} placeholder="Contoh: Sistem Informasi Terintegrasi" />
                        </div>
                    </div>
                </div>

                {/* Contact Section */}
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Kontak</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2">
                            <label className={labelClass}>Alamat</label>
                            <textarea {...register('address')} className={inputClass} rows={2} placeholder="Alamat lengkap perusahaan" />
                        </div>
                        <div>
                            <label className={labelClass}>Telepon</label>
                            <input {...register('phone')} className={inputClass} placeholder="021-xxx-xxxx" />
                        </div>
                        <div>
                            <label className={labelClass}>Email</label>
                            <input {...register('email')} type="email" className={inputClass} placeholder="info@perusahaan.com" />
                        </div>
                        <div>
                            <label className={labelClass}>Website</label>
                            <input {...register('website')} className={inputClass} placeholder="https://perusahaan.com" />
                        </div>
                    </div>
                </div>

                {/* App Section */}
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Aplikasi</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className={labelClass}>Versi Aplikasi</label>
                            <input {...register('app_version')} className={inputClass} placeholder="1.0.0" />
                        </div>
                        <div>
                            <label className={labelClass}>Footer Text</label>
                            <input {...register('footer_text')} className={inputClass} placeholder="Teks yang ditampilkan di footer laporan" />
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={updateMutation.isPending}
                        className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 shadow-sm"
                    >
                        <span className="material-symbols-outlined text-[18px]">save</span>
                        {updateMutation.isPending ? 'Menyimpan...' : 'Simpan Pengaturan'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CompanySettingsPage;
