export enum LayoutView {
    VIEW_1 = 'view1', // Default: Sidebar Expanded, Standard Table
    VIEW_2 = 'view2', // Compact: Sidebar Collapsed, Compact Table
    VIEW_3 = 'view3', // Modern: Floating Filters (Visual style)
    VIEW_4 = 'view4', // Grid: Grid/Card View
    VIEW_5 = 'view5', // Focus: Sidebar Hidden
    VIEW_6 = 'view6', // Dense: High density table with borders
    VIEW_7 = 'view7', // Split: List + Detail (Placeholder/Standard for now)
}

export interface LayoutConfig {
    sidebar: 'expanded' | 'collapsed' | 'hidden';
    tableDensity: 'comfortable' | 'compact' | 'standard';
    mode: 'list' | 'grid' | 'kanban';
    filterPosition: 'card' | 'floating' | 'header';
    showBorders?: boolean;
}

export const LAYOUT_CONFIGS: Record<LayoutView, LayoutConfig> = {
    [LayoutView.VIEW_1]: {
        sidebar: 'expanded',
        tableDensity: 'standard',
        mode: 'list',
        filterPosition: 'card'
    },
    [LayoutView.VIEW_2]: {
        sidebar: 'collapsed',
        tableDensity: 'compact',
        mode: 'list',
        filterPosition: 'card'
    },
    [LayoutView.VIEW_3]: {
        sidebar: 'expanded',
        tableDensity: 'standard',
        mode: 'list',
        filterPosition: 'floating'
    },
    [LayoutView.VIEW_4]: {
        sidebar: 'expanded',
        tableDensity: 'standard',
        mode: 'grid',
        filterPosition: 'card'
    },
    [LayoutView.VIEW_5]: {
        sidebar: 'hidden',
        tableDensity: 'standard',
        mode: 'list',
        filterPosition: 'card'
    },
    [LayoutView.VIEW_6]: {
        sidebar: 'expanded',
        tableDensity: 'compact',
        mode: 'list',
        filterPosition: 'card',
        showBorders: true
    },
    [LayoutView.VIEW_7]: {
        sidebar: 'expanded',
        tableDensity: 'standard',
        mode: 'list', // Could be split in future
        filterPosition: 'card'
    }
};
