import { useOnlineStatus } from '../../hooks/useOnlineStatus';

/**
 * Thin global banner shown while the browser is offline (INV-N06). Signals to
 * field users that any data on screen is served from cache and may be stale,
 * and that actions requiring the network won't go through until reconnected.
 */
const OfflineBanner = () => {
    const online = useOnlineStatus();
    if (online) return null;

    return (
        <div
            role="status"
            aria-live="polite"
            className="flex items-center justify-center gap-2 bg-amber-400 px-4 py-1.5 text-center text-sm font-medium text-amber-950"
        >
            <svg
                className="h-4 w-4 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
                />
            </svg>
            <span>Mode offline — menampilkan data dari cache. Perubahan tidak akan tersimpan sampai koneksi kembali.</span>
        </div>
    );
};

export default OfflineBanner;
