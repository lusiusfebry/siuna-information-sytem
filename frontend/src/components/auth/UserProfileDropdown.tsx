import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';

const UserProfileDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e7ebf3] dark:bg-slate-800 text-[#0d121b] dark:text-slate-300 overflow-hidden border border-gray-200 dark:border-gray-700"
            >
                {user?.employee?.foto_karyawan ? (
                    <img src={user.employee.foto_karyawan} alt={user?.employee?.nama_lengkap} className="h-full w-full object-cover" />
                ) : (
                    <span className="material-symbols-outlined">person</span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.employee?.nama_lengkap || user?.nik}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.roleDetails?.display_name || user?.roleDetails?.name || 'User'}</p>
                    </div>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">account_circle</span>
                        Profil Saya
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">settings</span>
                        Pengaturan
                    </button>
                    <div className="border-t border-gray-100 dark:border-gray-800 my-1"></div>
                    <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">logout</span>
                        Keluar
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserProfileDropdown;
