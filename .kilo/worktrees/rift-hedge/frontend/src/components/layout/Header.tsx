
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import UserProfileDropdown from '../auth/UserProfileDropdown';
import { useAuthStore } from '../../stores/authStore';
import { useUnreadCount, useNotifications, useMarkAsRead, useMarkAllAsRead } from '../../hooks/useNotifications';
import type { NotificationItem } from '../../services/api/notification.service';

const MODULE_HEADERS: Record<string, { title: string; links: { label: string; href: string }[] }> = {
    hr: { title: 'Human Resources', links: [{ label: 'Direktori', href: '#' }, { label: 'Organisasi', href: '#' }] },
    inventory: { title: 'Inventory Management', links: [{ label: 'Stok', href: '#' }, { label: 'Laporan', href: '#' }] },
    settings: { title: 'Pengaturan Sistem', links: [{ label: 'Konfigurasi', href: '#' }] },
};

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuthStore();
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);

    const { data: unreadData } = useUnreadCount();
    const { data: notifsData } = useNotifications();
    const markAsReadMutation = useMarkAsRead();
    const markAllMutation = useMarkAllAsRead();

    const unreadCount = unreadData?.data?.count || 0;
    const notifications: NotificationItem[] = notifsData?.data || [];

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setShowNotifDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const activeModule = location.pathname.startsWith('/inventory') ? 'inventory'
        : location.pathname.startsWith('/settings') ? 'settings' : 'hr';
    const config = MODULE_HEADERS[activeModule];

    return (
        <header className="h-20 border-b border-[#e7ebf3] dark:border-[#2a3447] bg-white dark:bg-[#161e2e] flex items-center justify-between px-8 sticky top-0 z-10 shrink-0 shadow-sm/5">
            <div className="flex items-center gap-4">
                <h2 className="text-xl font-extrabold text-[#0d121b] dark:text-white tracking-tight">{config.title}</h2>
                <nav className="hidden lg:flex items-center gap-8 ml-10">
                    {config.links.map(link => (
                        <a key={link.label} className="text-[13px] font-bold text-[#4c669a] hover:text-primary transition-all uppercase tracking-widest" href={link.href}>{link.label}</a>
                    ))}
                </nav>
            </div>
            <div className="flex items-center gap-6">
                <div className="relative hidden xl:block">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#4c669a] text-xl opacity-60">search</span>
                    <input
                        className="bg-[#f6f6f8] dark:bg-[#2a3447] border border-[#e7ebf3] dark:border-[#374151] rounded-xl pl-12 pr-4 py-2.5 text-sm w-72 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none dark:text-white transition-all font-medium"
                        placeholder="Cari karyawan, departemen, atau NIK..."
                        type="text"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/welcome')}
                        className="p-2.5 bg-[#f6f6f8] dark:bg-[#2a3447] border border-[#e7ebf3] dark:border-[#374151] rounded-xl text-[#4c669a] dark:text-[#f8f9fc] hover:bg-white hover:border-primary/30 hover:text-primary transition-all shadow-sm group"
                        title="Kembali ke Menu Utama"
                    >
                        <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">apps</span>
                    </button>
                    <div className="relative" ref={notifRef}>
                        <button
                            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                            className="p-2.5 bg-[#f6f6f8] dark:bg-[#2a3447] border border-[#e7ebf3] dark:border-[#374151] rounded-xl text-[#4c669a] dark:text-[#f8f9fc] hover:bg-white hover:border-primary/30 hover:text-primary transition-all shadow-sm relative"
                        >
                            <span className="material-symbols-outlined text-xl">notifications</span>
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {showNotifDropdown && (
                            <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-[480px] flex flex-col">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifikasi</h3>
                                    {unreadCount > 0 && (
                                        <button onClick={() => markAllMutation.mutate()} className="text-xs text-primary hover:underline">
                                            Tandai semua dibaca
                                        </button>
                                    )}
                                </div>
                                <div className="overflow-y-auto flex-1">
                                    {notifications.length === 0 ? (
                                        <div className="px-4 py-8 text-center text-gray-400 text-sm">Tidak ada notifikasi</div>
                                    ) : (
                                        notifications.slice(0, 10).map((notif) => (
                                            <div
                                                key={notif.id}
                                                onClick={() => { if (!notif.is_read) markAsReadMutation.mutate(notif.id); }}
                                                className={`px-4 py-3 border-b border-gray-50 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!notif.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <span className={`material-symbols-outlined text-[20px] mt-0.5 ${notif.type === 'warning' ? 'text-orange-500' : 'text-blue-500'}`}>
                                                        {notif.type === 'warning' ? 'warning' : 'info'}
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{notif.title}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
                                                        <p className="text-[10px] text-gray-400 mt-1">
                                                            {new Date(notif.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                    {!notif.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0" />}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <button className="p-2.5 bg-[#f6f6f8] dark:bg-[#2a3447] border border-[#e7ebf3] dark:border-[#374151] rounded-xl text-[#4c669a] dark:text-[#f8f9fc] hover:bg-white hover:border-primary/30 hover:text-primary transition-all shadow-sm">
                        <span className="material-symbols-outlined text-xl">settings</span>
                    </button>
                </div>
                <div className="h-10 w-[1px] bg-[#e7ebf3] dark:bg-[#2a3447] mx-2"></div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end hidden sm:flex">
                        <span className="text-sm font-extrabold text-[#0d121b] dark:text-white leading-none">
                            {user?.employee?.nama_lengkap || user?.nik || 'User'}
                        </span>
                        <span className="text-[11px] font-bold text-[#4c669a] dark:text-gray-400 mt-1 uppercase tracking-wider">
                            {user?.roleDetails?.display_name || user?.roleDetails?.name || 'Administrator'}
                        </span>
                    </div>
                    <UserProfileDropdown />
                </div>
            </div>
        </header>
    );
};

export default Header;
