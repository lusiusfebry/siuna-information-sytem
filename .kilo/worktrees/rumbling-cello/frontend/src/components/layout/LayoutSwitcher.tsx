import React, { useEffect } from 'react';
import { LayoutView } from '../../types/layout';

interface LayoutSwitcherProps {
    currentLayout: LayoutView;
    onLayoutChange: (layout: LayoutView) => void;
}

const LayoutSwitcher: React.FC<LayoutSwitcherProps> = ({ currentLayout, onLayoutChange }) => {

    // Save to localStorage whenever layout changes (handled by parent usually, but ensuring effect here or just relying on parent is fine. 
    // Actually, parent state init is better. But let's adhere to "LayoutSwitcher implements... persistence" request interpretation: 
    // The request said "localStorage persistence", often implying the switcher logic handles saving preference.
    // However, clean React pattern is parent handles state. I will assume parent init from localStorage, 
    // and here we just trigger change. I will add a side effect to save here for convenience if parent doesn't.
    useEffect(() => {
        localStorage.setItem('masterDataLayout', currentLayout);
    }, [currentLayout]);

    const buttons = [
        { view: LayoutView.VIEW_1, icon: 'list', title: 'Default (Expanded, Standard)' },
        { view: LayoutView.VIEW_2, icon: 'view_list', title: 'Compact (Collapsed, Compact)' },
        { view: LayoutView.VIEW_3, icon: 'view_headline', title: 'Modern (Floating Filters)' },
        { view: LayoutView.VIEW_4, icon: 'grid_view', title: 'Grid (Kanban/Cards)' },
        { view: LayoutView.VIEW_5, icon: 'fullscreen', title: 'Focus (Hidden Sidebar)' },
        { view: LayoutView.VIEW_6, icon: 'table_rows', title: 'Dense (Borders, Compact)' },
        { view: LayoutView.VIEW_7, icon: 'vertical_split', title: 'Split (Detailed)' },
    ];

    return (
        <div className="flex bg-gray-100 p-1 rounded-lg gap-1">
            {buttons.map((btn) => (
                <button
                    key={btn.view}
                    onClick={() => onLayoutChange(btn.view)}
                    className={`w-8 h-8 flex items-center justify-center rounded-md text-sm transition-all ${currentLayout === btn.view
                        ? 'bg-white shadow-sm text-primary ring-1 ring-black/5'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                        }`}
                    title={btn.title}
                >
                    <span className="material-symbols-outlined text-[20px]">{btn.icon}</span>
                </button>
            ))}
        </div>
    );
};

export default LayoutSwitcher;
