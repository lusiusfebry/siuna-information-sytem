import toast from 'react-hot-toast';
import { registerSW } from 'virtual:pwa-register';

/**
 * Registers the service worker (INV-N06). `autoUpdate` fetches a new build in
 * the background; when it's ready we prompt the user to reload rather than
 * refreshing out from under them mid-task. No-op in dev (SW disabled there).
 */
export function setupPWA() {
    const updateSW = registerSW({
        onNeedRefresh() {
            toast(
                (t) => (
                    <div className="flex items-center gap-3">
                        <span>Versi baru tersedia.</span>
                        <button
                            className="rounded bg-primary px-2 py-1 text-xs font-semibold text-white"
                            onClick={() => {
                                toast.dismiss(t.id);
                                updateSW(true);
                            }}
                        >
                            Muat ulang
                        </button>
                    </div>
                ),
                { duration: Infinity }
            );
        },
        onOfflineReady() {
            toast.success('Aplikasi siap digunakan offline.');
        },
    });
}
