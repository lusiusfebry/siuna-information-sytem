import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LayoutContextType {
    sidebarCollapsed: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <LayoutContext.Provider value={{ sidebarCollapsed, setSidebarCollapsed }}>
            {children}
        </LayoutContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLayout = () => {
    const context = useContext(LayoutContext);
    if (!context) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return context;
};
