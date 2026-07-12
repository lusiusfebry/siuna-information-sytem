import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import UserProfileDropdown from '../components/auth/UserProfileDropdown';
import { useCompanySettings } from '../hooks/useCompanySettings';
import { useNotifications, useUnreadCount } from '../hooks/useNotifications';

const WelcomePage = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const { data: settings } = useCompanySettings();
    const { data: notifData } = useNotifications();
    const { data: unreadData } = useUnreadCount();
    const unreadCount = unreadData?.data?.count || 0;
    const notifications = (notifData?.data || []).slice(0, 4);

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
                                {settings?.company_legal_name || 'PT Prima Sarana Gemilang'}
                            </h2>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#4c669a]">
                                {settings?.company_name || 'Bebang Sistem Informasi'}
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
                        <button className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#e7ebf3] dark:bg-slate-800 text-[#0d121b] dark:text-slate-300" title={`${unreadCount} notifikasi belum dibaca`}>
                            <span className="material-symbols-outlined">notifications</span>
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
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

                        <div
                            onClick={() => navigate('/facility')}
                            className="module-card group flex flex-col bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 cursor-pointer hover:shadow-xl hover:border-primary/30 transition-all">
                            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-[32px]">hotel</span>
                            </div>
                            <div className="flex flex-col gap-1 mb-4">
                                <p className="text-[#0d121b] dark:text-white text-lg font-bold leading-tight">Facility Mgmt</p>
                                <p className="text-[#4c669a] dark:text-slate-400 text-sm font-medium leading-relaxed">
                                    Gedung, Ruangan & Akomodasi Site
                                </p>
                            </div>
                            <div className="mt-auto flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 bg-teal-50 dark:bg-teal-900/20 px-2 py-1 rounded">
                                    Active
                                </span>
                                <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">
                                    arrow_forward
                                </span>
                            </div>
                        </div>

                        <div
                            onClick={() => navigate('/settings')}
                            className="module-card group flex flex-col bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 cursor-pointer hover:shadow-xl hover:border-primary/30 transition-all">
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
                                    Active
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
                            </div>
                            <div className="space-y-4">
                                {notifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-center text-[#4c669a]">
                                        <span className="material-symbols-outlined text-4xl opacity-30 mb-2">notifications_off</span>
                                        <p className="text-sm">Tidak ada pemberitahuan</p>
                                    </div>
                                ) : (
                                    notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            className={`flex gap-4 p-3 rounded-lg ${n.is_read ? '' : 'bg-background-light dark:bg-slate-800/50'}`}
                                        >
                                            <div className={n.type === 'warning' ? 'text-orange-500' : 'text-primary'}>
                                                <span className="material-symbols-outlined">
                                                    {n.type === 'warning' ? 'warning' : 'info'}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">{n.title}</p>
                                                <p className="text-xs text-[#4c669a]">{n.message}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        <div className="bg-primary rounded-xl p-6 text-white shadow-xl shadow-primary/20 flex flex-col justify-between">
                            <div>
                                <p className="text-blue-100 text-sm font-medium mb-1">Absensi &amp; Cuti</p>
                                <p className="text-2xl font-black">Segera Hadir</p>
                                <p className="text-blue-100 text-xs mt-2">Modul pencatatan kehadiran dan pengajuan cuti sedang dalam pengembangan.</p>
                            </div>
                            <div className="mt-6 flex items-center gap-2 text-blue-100">
                                <span className="material-symbols-outlined text-[20px]">schedule</span>
                                <span className="text-xs font-medium">Dalam roadmap</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* System Footer */}
            <footer className="border-t border-[#e7ebf3] dark:border-slate-800 bg-white dark:bg-slate-900 px-6 lg:px-10 py-6">
                <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <p className="text-[#4c669a] text-xs font-medium">
                            © {new Date().getFullYear()} {settings?.company_legal_name || 'PT Prima Sarana Gemilang'}. Hak Cipta Dilindungi.
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
