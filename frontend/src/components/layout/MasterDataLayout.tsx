import React, { ReactNode, useEffect } from 'react';
import { useLayout } from '../../context/LayoutContext';
import { LayoutView, LAYOUT_CONFIGS } from '../../types/layout';
import { motion } from 'framer-motion';

interface MasterDataLayoutProps {
    children: ReactNode;
    view: LayoutView;
}

const MasterDataLayout: React.FC<MasterDataLayoutProps> = ({ children, view }) => {
    const { setSidebarCollapsed } = useLayout();
    const config = LAYOUT_CONFIGS[view];

    useEffect(() => {
        if (config.sidebar === 'collapsed') {
            setSidebarCollapsed(true);
        } else if (config.sidebar === 'expanded') {
            setSidebarCollapsed(false);
        }
    }, [view, config.sidebar, setSidebarCollapsed]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="premium-card p-6 min-h-[600px]"
        >
            {children}
        </motion.div>
    );
};

export default MasterDataLayout;
