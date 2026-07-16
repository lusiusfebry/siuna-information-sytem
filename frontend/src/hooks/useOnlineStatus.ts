import { useEffect, useState } from 'react';

/**
 * Tracks browser online/offline state. Used to surface an offline indicator
 * (INV-N06) so field users on flaky mine-site connectivity know when the app
 * is serving cached data rather than live results.
 */
export const useOnlineStatus = (): boolean => {
    const [online, setOnline] = useState<boolean>(
        typeof navigator !== 'undefined' ? navigator.onLine : true
    );

    useEffect(() => {
        const goOnline = () => setOnline(true);
        const goOffline = () => setOnline(false);
        window.addEventListener('online', goOnline);
        window.addEventListener('offline', goOffline);
        return () => {
            window.removeEventListener('online', goOnline);
            window.removeEventListener('offline', goOffline);
        };
    }, []);

    return online;
};

export default useOnlineStatus;
