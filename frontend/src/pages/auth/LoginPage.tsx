import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../../stores/authStore';
import { loginSchema, LoginInput } from '../../schemas/auth.schema';
import { authService } from '../../services/api/auth.service';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { useCompanySettings } from '../../hooks/useCompanySettings';

const LoginPage = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { login } = useAuthStore();
    const navigate = useNavigate();
    const { data: settings } = useCompanySettings();

    const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
    const logoUrl = settings?.logo_url ? `${apiBase}${settings.logo_url}` : null;

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginInput) => {
        try {
            setError(null);
            const response = await authService.login(data);
            login(response.data.token, response.data.user);
            navigate('/welcome');
        } catch (err: unknown) {
            console.error(err);
            const error = err as AxiosError<{ message: string }>;
            setError(error.response?.data?.message || 'Terjadi kesalahan saat login');
            // If unauthorized, specific error is already in catch, but we set robust fallback
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-display">
            {/* Top Navigation Bar */}
            <header className="w-full bg-white dark:bg-background-dark border-b border-solid border-[#e7ebf3] dark:border-gray-800 px-6 md:px-20 lg:px-40 py-4">
                <div className="max-w-[1280px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3 text-primary">
                        <div className="w-8 h-8 text-primary">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                                <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M24 4C25.7818 14.2173 33.7827 22.2182 44 24C33.7827 25.7818 25.7818 33.7827 24 44C22.2182 33.7827 14.2173 25.7818 4 24C14.2173 22.2182 22.2182 14.2173 24 4Z"
                                        fill="currentColor"
                                    ></path>
                                </svg>
                            )}
                        </div>
                        <h2 className="text-[#0d121b] dark:text-white text-lg font-bold leading-tight tracking-tight">
                            {settings?.company_name || 'Bebang Sistem Informasi'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-6">
                        <a
                            className="hidden md:block text-[#4c669a] dark:text-gray-400 text-sm font-medium hover:text-primary transition-colors"
                            href="#"
                        >
                            Tentang Kami
                        </a>
                        <a
                            className="hidden md:block text-[#4c669a] dark:text-gray-400 text-sm font-medium hover:text-primary transition-colors"
                            href="#"
                        >
                            Bantuan
                        </a>
                        <button className="flex min-w-[100px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold shadow-sm hover:bg-blue-700 transition-all">
                            <span>Hubungi IT</span>
                        </button>
                    </div>
                </div>
            </header>

            <main
                className="flex-1 flex items-center justify-center p-6 bg-cover bg-center"
                data-alt="Modern corporate architectural building with glass windows"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(246, 246, 248, 0.9), rgba(246, 246, 248, 0.9)), url('https://lh3.googleusercontent.com/aida-public/AB6AXuD2hiAeUaNkFR2ik2BbhejrsaKpZvGfqXXl12Bdot5BraUmQiUGjXcNmZkjehbRFF59Y1XEEYkyDnWmLIbTS8Q-YiIJHLLHdzwX81x8dQPoqJi5hDfuN_iM-bISselPINwXA396CzWozCBxJxQXNA5WOeddpjCj95NZhL4Eq6THwQSVvItltHW7jLx7GdEl9H7f_sM5POF392JX2qyH6eeTUyERXaXDc5GTLDi5U5to-WvZQlKE01fjRfzak5NObqFjXW9a9ptLllPP')",
                }}
            >
                <div className="w-full max-w-[480px] bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                    {/* Header Section with Image */}
                    <div className="p-0">
                        <div
                            className="w-full h-32 bg-primary/10 flex items-center justify-center bg-cover bg-center"
                            data-alt="Abstract modern industrial architectural interior background"
                            style={{
                                backgroundImage:
                                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCefAvhOtv8gY4HKetPd3VkgC2CpWd8Vk7lUspwPoYi_OlIax7Spp-8yvdEv-CfurIPYFjVILSxOizJZ4FUKPNZIXFWLawNpb-Ty3K2Qcnl_enQWTRdhTTk2JP6outK8YouHJqtctDxL__YlGFiAPD0DQlufyGWXVOAPKETbm12AiSD67vsoK42ajWcLxrd426F0ruHiPA29Q_iYUyWyM0SutjyXg_cqLNFEFPg6U1DnZG_oOmkMOANCaki0nkXEbNJ3nxu-cDLOxC2')",
                            }}
                        >
                            <div className="bg-white/90 dark:bg-gray-900/90 p-4 rounded-full shadow-lg">
                                <div className="w-10 h-10 text-primary">
                                    {logoUrl ? (
                                        <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                                    ) : (
                                        <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                d="M24 4C25.7818 14.2173 33.7827 22.2182 44 24C33.7827 25.7818 25.7818 33.7827 24 44C22.2182 33.7827 14.2173 25.7818 4 24C14.2173 22.2182 22.2182 14.2173 24 4Z"
                                                fill="currentColor"
                                            ></path>
                                        </svg>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="px-8 pt-8 pb-10">
                        <div className="text-center mb-8">
                            <h1 className="text-[#0d121b] dark:text-white text-2xl font-bold tracking-tight">
                                Selamat Datang di {settings?.company_short_name || 'Bebang'}
                            </h1>
                            <p className="text-[#4c669a] dark:text-gray-400 text-sm mt-2">
                                {settings?.company_tagline || 'Sistem Informasi Terintegrasi'} {settings?.company_legal_name || 'PT Prima Sarana Gemilang'}
                            </p>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                            {/* NIK Field */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[#0d121b] dark:text-gray-200 text-sm font-semibold">
                                    Nomor Induk Karyawan
                                </label>
                                <div className="relative flex items-center">
                                    <input
                                        {...register('nik')}
                                        className="form-input block w-full rounded-lg border-[#cfd7e7] dark:border-gray-700 bg-background-light dark:bg-gray-800 text-[#0d121b] dark:text-white h-12 pl-4 pr-12 text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-[#a1acc3]"
                                        placeholder="Masukkan NIK Anda"
                                        type="text"
                                    />
                                    <div className="absolute right-4 text-[#4c669a]">
                                        <span className="material-symbols-outlined">badge</span>
                                    </div>
                                </div>
                                {errors.nik && (
                                    <p className="text-red-500 text-xs">{errors.nik.message}</p>
                                )}
                            </div>

                            {/* Password Field */}
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-[#0d121b] dark:text-gray-200 text-sm font-semibold">Kata Sandi</label>
                                    <a className="text-primary text-xs font-semibold hover:underline" href="#">
                                        Lupa Sandi?
                                    </a>
                                </div>
                                <div className="relative flex items-center">
                                    <input
                                        {...register('password')}
                                        className="form-input block w-full rounded-lg border-[#cfd7e7] dark:border-gray-700 bg-background-light dark:bg-gray-800 text-[#0d121b] dark:text-white h-12 pl-4 pr-12 text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-[#a1acc3]"
                                        placeholder="••••••••"
                                        type={showPassword ? 'text' : 'password'}
                                    />
                                    <div
                                        className="absolute right-4 text-[#4c669a] cursor-pointer hover:text-primary transition-colors"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        <span className="material-symbols-outlined">
                                            {showPassword ? 'visibility' : 'visibility_off'}
                                        </span>
                                    </div>
                                </div>
                                {errors.password && (
                                    <p className="text-red-500 text-xs">{errors.password.message}</p>
                                )}
                            </div>

                            {/* Remember Me */}
                            <div className="flex items-center gap-2 py-1">
                                <input
                                    {...register('rememberMe')}
                                    className="rounded border-[#cfd7e7] text-primary focus:ring-primary"
                                    id="remember"
                                    type="checkbox"
                                />
                                <label className="text-xs text-[#4c669a] dark:text-gray-400 font-medium" htmlFor="remember">
                                    Ingat saya di perangkat ini
                                </label>
                            </div>

                            {/* Submit Button */}
                            <button
                                className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-blue-700 text-white font-bold h-12 transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                type="submit"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <span>Memproses...</span>
                                ) : (
                                    <>
                                        <span>Masuk ke Akun</span>
                                        <span className="material-symbols-outlined text-sm">login</span>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
                            <p className="text-xs text-[#4c669a] dark:text-gray-500">
                                Mengalami kendala saat login?{' '}
                                <a className="text-primary font-semibold hover:underline" href="#">
                                    Hubungi Administrator
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full py-6 text-center">
                <div className="px-4">
                    <p className="text-xs text-[#4c669a] dark:text-gray-500 font-medium uppercase tracking-widest">
                        © {new Date().getFullYear()} {settings?.company_legal_name || 'PT Prima Sarana Gemilang'} • IT Division • v{settings?.app_version || '1.4.2'}
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default LoginPage;
