import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { LayoutProvider, useLayout } from '../../context/LayoutContext';

const MainLayoutContent = () => {
    const { sidebarCollapsed } = useLayout();

    return (
        <div className="flex h-screen bg-[#f6f6f8] dark:bg-[#101622] overflow-hidden transition-colors duration-300">
            {/* Sidebar */}
            <div className={`flex-shrink-0 transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
                <Sidebar collapsed={sidebarCollapsed} />
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#f6f6f8] dark:bg-[#101622] p-4 md:p-8">
                    <div className="mx-auto w-full">
                        <Outlet />
                    </div>
                </main>
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
