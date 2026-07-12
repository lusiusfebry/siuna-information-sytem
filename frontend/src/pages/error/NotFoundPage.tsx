import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

/** 404 page. Unlike the old `* -> /login` redirect, an authenticated user who
 *  hits an unknown/not-yet-built route (e.g. the Absensi & Cuti placeholder)
 *  sees a real "not found" page instead of being bounced to the login screen. */
const NotFoundPage = () => {
    const { isAuthenticated } = useAuthStore();
    const home = isAuthenticated ? '/welcome' : '/login';

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#f6f6f8] dark:bg-[#101622] px-4 text-center">
            <span className="material-symbols-outlined text-7xl text-primary/40 mb-4">
                {isAuthenticated ? 'construction' : 'search_off'}
            </span>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">404</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                {isAuthenticated
                    ? 'Halaman ini belum tersedia atau sedang dalam pengembangan.'
                    : 'Halaman yang Anda cari tidak ditemukan.'}
            </p>
            <Link
                to={home}
                className="px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
            >
                {isAuthenticated ? 'Kembali ke Beranda' : 'Ke Halaman Login'}
            </Link>
        </div>
    );
};

export default NotFoundPage;
