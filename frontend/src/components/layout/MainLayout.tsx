import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { LayoutProvider, useLayout } from '../../context/LayoutContext';
import { ErrorBoundary } from '../common/ErrorBoundary';
import OfflineBanner from '../common/OfflineBanner';

const MainLayoutContent = () => {
    const { sidebarCollapsed } = useLayout();
    const location = useLocation();

    return (
        <div className="flex flex-col h-screen bg-[#f6f6f8] dark:bg-[#101622] overflow-hidden transition-colors duration-300">
            {/* Offline indicator (INV-N06) — spans full width above the app chrome. */}
            <OfflineBanner />
            <div className="flex flex-1 min-h-0">
            {/* Sidebar */}
            <div className={`flex-shrink-0 transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
                <Sidebar collapsed={sidebarCollapsed} />
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#f6f6f8] dark:bg-[#101622] p-4 md:p-8">
                    <div className="mx-auto w-full">
                        {/* Per-route ErrorBoundary: a crash in one page shows a
                            localized fallback instead of blanking the whole app.
                            Keyed by pathname so it resets on navigation. */}
                        <ErrorBoundary key={location.pathname}>
                            <Outlet />
                        </ErrorBoundary>
                    </div>
                </main>
            </div>
            </div>
        </div>
    );
};

const MainLayout = () => {
    return (
        <LayoutProvider>
            <MainLayoutContent />
        </LayoutProvider>
    );
};

export default MainLayout;
