import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import UserProfileDropdown from '../components/auth/UserProfileDropdown';

const WelcomePage = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-[#0d121b] dark:text-slate-200 min-h-screen flex flex-col">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-[#e7ebf3] dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-3 lg:px-10">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
                            <span className="material-symbols-outlined">corporate_fare</span>
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-[#0d121b] dark:text-white text-base font-bold leading-tight tracking-tight">
                                PT Prima Sarana Gemilang
                            </h2>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#4c669a]">
                                Bebang Sistem Informasi
                            </span>
                        </div>
                    </div>
                    <div className="hidden md:flex">
                        <label className="flex flex-col min-w-64 !h-10">
                            <div className="flex w-full flex-1 items-stretch rounded-lg h-full bg-[#e7ebf3] dark:bg-slate-800">
                                <div className="text-[#4c669a] flex items-center justify-center pl-4">
                                    <span className="material-symbols-outlined text-[20px]">search</span>
                                </div>
                                <input
                                    className="form-input flex w-full min-w-0 flex-1 border-none bg-transparent focus:ring-0 text-sm placeholder:text-[#4c669a] dark:text-slate-200"
                                    placeholder="Cari modul atau data..."
                                />
                            </div>
                        </label>
                    </div>
                </div>
                <div className="flex items-center gap-4 lg:gap-8">
                    <nav className="hidden lg:flex items-center gap-6">
                        <a
                            className="text-[#0d121b] dark:text-slate-300 text-sm font-semibold hover:text-primary transition-colors"
                            href="#"
                        >
                            Beranda
                        </a>
                        <a
                            className="text-[#0d121b] dark:text-slate-300 text-sm font-semibold hover:text-primary transition-colors"
                            href="#"
                        >
                            Laporan
                        </a>
                        <a
                            className="text-[#0d121b] dark:text-slate-300 text-sm font-semibold hover:text-primary transition-colors"
                            href="#"
                        >
                            Bantuan
                        </a>
                    </nav>
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden lg:block"></div>
                    <div className="flex items-center gap-4">
                        <button className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#e7ebf3] dark:bg-slate-800 text-[#0d121b] dark:text-slate-300">
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-red-500"></span>
                        </button>
                        <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-700 pl-4">
                            <div className="hidden sm:flex flex-col items-end">
                                <span className="text-xs font-bold dark:text-white">{user?.employee?.nama_lengkap || user?.nik}</span>
                                <span className="text-[10px] text-[#4c669a] capitalize">{user?.roleDetails?.display_name || user?.roleDetails?.name}</span>
                            </div>
                            <UserProfileDropdown />
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex flex-1 justify-center">
                <div className="layout-content-container flex flex-col w-full max-w-[1280px] px-6 lg:px-10 py-8">
                    {/* Breadcrumbs */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        <a
                            className="text-[#4c669a] text-xs font-semibold hover:text-primary flex items-center gap-1"
                            href="#"
                        >
                            <span className="material-symbols-outlined text-[14px]">dashboard</span> Dashboard
                        </a>
                        <span className="text-[#4c669a] text-xs">/</span>
                        <span className="text-[#0d121b] dark:text-slate-400 text-xs font-bold">Beranda Modul Utama</span>
                    </div>
                    {/* Page Heading */}
                    <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-[#0d121b] dark:text-white text-3xl lg:text-4xl font-black leading-tight tracking-tight">
                                Selamat Datang, {user?.employee?.nama_lengkap ? user.employee.nama_lengkap.split(' ')[0] : 'User'}
                            </h1>
                            <p className="text-[#4c669a] dark:text-slate-400 text-base font-medium">
                                Enterprise Resource Planning & Integrated Management System
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button className="flex items-center gap-2 cursor-pointer justify-center rounded-lg h-10 px-5 bg-[#e7ebf3] dark:bg-slate-800 text-[#0d121b] dark:text-white text-sm font-bold transition-all hover:bg-slate-200 dark:hover:bg-slate-700">
                                <span className="material-symbols-outlined text-[20px]">history</span>
                                <span>Aktivitas</span>
                            </button>
                            <button className="flex items-center gap-2 cursor-pointer justify-center rounded-lg h-10 px-5 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-700 transition-all">
                                <span className="material-symbols-outlined text-[20px]">bolt</span>
                                <span>Quick Actions</span>
                            </button>
                        </div>
                    </div>
                    {/* Section Title */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-6 w-1 bg-primary rounded-full"></div>
                        <h3 className="text-lg font-bold text-[#0d121b] dark:text-white">Daftar Modul Terintegrasi</h3>
                    </div>
                    {/* Main Module Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                        {/* Human Resources Card */}
                        <div
                            onClick={() => navigate('/hr')}
                            className="module-card group flex flex-col bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 cursor-pointer hover:shadow-xl hover:border-primary/30 transition-all"
                        >
                            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 text-primary group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-[32px]">groups</span>
                            </div>
                            <div className="flex flex-col gap-1 mb-4">
                                <p className="text-[#0d121b] dark:text-white text-lg font-bold leading-tight">Human Resources</p>
                                <p className="text-[#4c669a] dark:text-slate-400 text-sm font-medium leading-relaxed">
                                    Manajemen Karyawan, Payroll & Presensi
                                </p>
                            </div>
                            <div className="mt-auto flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded">
                                    Active
                                </span>
                                <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">
                                    arrow_forward
                                </span>
                            </div>
                        </div>

                        {/* Placeholder for other modules */}
                        <div
                            onClick={() => navigate('/inventory')}
                            className="module-card group flex flex-col bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 cursor-pointer hover:shadow-xl hover:border-primary/30 transition-all">
                            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-[32px]">inventory_2</span>
                            </div>
                            <div className="flex flex-col gap-1 mb-4">
                                <p className="text-[#0d121b] dark:text-white text-lg font-bold leading-tight">Inventory</p>
                                <p className="text-[#4c669a] dark:text-slate-400 text-sm font-medium leading-relaxed">
                                    Stok Barang & Logistik Inventaris
                                </p>
                            </div>
                            <div className="mt-auto flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded">
                                    Active
                                </span>
                                <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">
                                    arrow_forward
                                </span>
                            </div>
                        </div>

                        <div className="module-card group flex flex-col bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 cursor-pointer hover:shadow-xl hover:border-primary/30 transition-all opacity-70">
                            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-[32px]">hotel</span>
                            </div>
                            <div className="flex flex-col gap-1 mb-4">
                                <p className="text-[#0d121b] dark:text-white text-lg font-bold leading-tight">Mess Management</p>
                                <p className="text-[#4c669a] dark:text-slate-400 text-sm font-medium leading-relaxed">
                                    Manajemen Mess & Akomodasi Site
                                </p>
                            </div>
                            <div className="mt-auto flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 bg-teal-50 dark:bg-teal-900/20 px-2 py-1 rounded">
                                    Coming Soon
                                </span>
                                <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">
                                    arrow_forward
                                </span>
                            </div>
                        </div>

                        <div className="module-card group flex flex-col bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 cursor-pointer hover:shadow-xl hover:border-primary/30 transition-all opacity-70">
                            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-[32px]">domain</span>
                            </div>
                            <div className="flex flex-col gap-1 mb-4">
                                <p className="text-[#0d121b] dark:text-white text-lg font-bold leading-tight">Building Mgmt</p>
                                <p className="text-[#4c669a] dark:text-slate-400 text-sm font-medium leading-relaxed">
                                    Pemeliharaan & Aset Gedung Kantor
                                </p>
                            </div>
                            <div className="mt-auto flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded">
                                    Coming Soon
                                </span>
                                <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">
                                    arrow_forward
                                </span>
                            </div>
                        </div>

                        <div className="module-card group flex flex-col bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 cursor-pointer hover:shadow-xl hover:border-primary/30 transition-all opacity-70">
                            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-[32px]">admin_panel_settings</span>
                            </div>
                            <div className="flex flex-col gap-1 mb-4">
                                <p className="text-[#0d121b] dark:text-white text-lg font-bold leading-tight">User Access</p>
                                <p className="text-[#4c669a] dark:text-slate-400 text-sm font-medium leading-relaxed">
                                    Keamanan & Hak Akses Pengguna
                                </p>
                            </div>
                            <div className="mt-auto flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                                    Coming Soon
                                </span>
                                <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">
                                    arrow_forward
                                </span>
                            </div>
                        </div>

                    </div>

                    {/* Secondary Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-12">
                        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="font-bold text-[#0d121b] dark:text-white">Pemberitahuan Sistem</h4>
                                <button className="text-xs font-bold text-primary">Lihat Semua</button>
                            </div>
                            <div className="space-y-4">
                                <div className="flex gap-4 p-3 rounded-lg bg-background-light dark:bg-slate-800/50">
                                    <div className="text-primary">
                                        <span className="material-symbols-outlined">info</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">Update Sistem v2.4 Berhasil</p>
                                        <p className="text-xs text-[#4c669a]">Integrasi modul Inventory dan HR telah diperbarui.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 p-3 rounded-lg">
                                    <div className="text-orange-500">
                                        <span className="material-symbols-outlined">warning</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">Maintenance Jadwal Mess</p>
                                        <p className="text-xs text-[#4c669a]">
                                            Akan dilakukan pembersihan data mess lama pada hari Sabtu.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-primary rounded-xl p-6 text-white shadow-xl shadow-primary/20 flex flex-col justify-between">
                            <div>
                                <p className="text-blue-100 text-sm font-medium mb-1">Status Kehadiran Hari Ini</p>
                                <p className="text-3xl font-black">94.2%</p>
                            </div>
                            <div className="mt-6">
                                <div className="flex justify-between text-xs mb-1">
                                    <span>Target Efisiensi</span>
                                    <span>98%</span>
                                </div>
                                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                                    <div className="bg-white h-full rounded-full" style={{ width: '94.2%' }}></div>
                                </div>
                            </div>
                            <button className="mt-6 w-full py-2 bg-white/10 hover:bg-white/20 transition-colors rounded-lg text-xs font-bold border border-white/20">
                                Buka Laporan HR
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* System Footer */}
            <footer className="border-t border-[#e7ebf3] dark:border-slate-800 bg-white dark:bg-slate-900 px-6 lg:px-10 py-6">
                <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <p className="text-[#4c669a] text-xs font-medium">
                            © 2024 PT Prima Sarana Gemilang. Hak Cipta Dilindungi.
                        </p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                            <span className="text-[10px] font-bold text-[#4c669a] uppercase tracking-widest">
                                Server: Production-01 (Online)
                            </span>
                        </div>
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700"></div>
                        <p className="text-[#4c669a] text-[10px] font-bold uppercase tracking-widest">
                            Versi Aplikasi 4.12.0-Stable
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default WelcomePage;
