import React from 'react';
import { PencilSquareIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Button from '../common/Button';
import { PermissionGuard } from '../auth/PermissionGuard';
import { RESOURCES, ACTIONS } from '../../types/permission';
import { LayoutView, LAYOUT_CONFIGS } from '../../types/layout';

export interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T, index: number) => React.ReactNode);
    className?: string;
}

interface MasterDataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    isLoading?: boolean;
    pagination?: {
        page: number;
        totalPages: number;
        totalItems: number;
        onPageChange: (page: number) => void;
    };
    onEdit: (item: T) => void;
    onDelete: (item: T) => void;
    view?: LayoutView;
    transparent?: boolean;
}

const MasterDataTable = <T extends { id: number | string; code?: string; status?: string; nama?: string; name?: string }>({
    columns,
    data,
    isLoading,
    pagination,
    onEdit,
    onDelete,
    view = LayoutView.VIEW_1,
    transparent = false
}: MasterDataTableProps<T>) => {

    const config = LAYOUT_CONFIGS[view];
    const isGrid = config.mode === 'grid';
    const isCompact = config.tableDensity === 'compact';
    const showBorders = config.showBorders;

    if (isLoading) {
        return (
            <div className={`w-full ${isGrid ? 'grid grid-cols-1 md:grid-cols-3 gap-4' : 'bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse'}`}>
                {/* Skeleton logic */}
                {isGrid
                    ? [1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse"></div>)
                    : (
                        <>
                            <div className="h-8 bg-gray-100 rounded mb-4 w-full"></div>
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-12 bg-gray-50 rounded mb-2 w-full"></div>
                            ))}
                        </>
                    )
                }
            </div>
        );
    }

    if (isGrid) {
        return (
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${transparent ? 'bg-transparent shadow-none border-0' : ''}`}>
                {data.length > 0 ? (
                    data.map((item, rowIndex) => {
                        const itemName = item.nama || item.name || 'Unnamed';
                        const status = item.status || 'Aktif';

                        return (
                            <div
                                key={item.id}
                                onClick={() => onEdit(item)}
                                className="group relative flex cursor-pointer flex-col gap-4 rounded-xl bg-white dark:bg-slate-800 p-5 shadow-sm ring-1 ring-gray-900/5 hover:shadow-md transition-all hover:-translate-y-1 dark:ring-slate-700"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="bg-primary/10 text-primary p-2.5 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                                            <span className="material-symbols-outlined text-xl">
                                                {/* Use icons based on common master data patterns */}
                                                {itemName.toLowerCase().includes('dept') ? 'corporate_fare' :
                                                    itemName.toLowerCase().includes('divisi') ? 'groups' :
                                                        itemName.toLowerCase().includes('lokasi') ? 'location_on' :
                                                            itemName.toLowerCase().includes('jabatan') ? 'work' : 'layers'}
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">
                                                    {(pagination ? (pagination.page - 1) * 10 : 0) + rowIndex + 1}
                                                </span>
                                                <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate" title={itemName}>
                                                    {itemName}
                                                </h4>
                                            </div>
                                            {item.code && (
                                                <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400 ml-7">
                                                    {item.code}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset uppercase tracking-wider shrink-0 ${status === 'Aktif' || status === 'true'
                                        ? 'bg-green-50 text-green-700 ring-green-600/20'
                                        : 'bg-gray-50 text-gray-700 ring-gray-600/10'
                                        }`}>
                                        {status === 'true' ? 'Aktif' : status === 'false' ? 'Non-Aktif' : status}
                                    </span>
                                </div>

                                <div className="border-t border-gray-100 dark:border-slate-700 pt-4 mt-auto">
                                    <div className="grid grid-cols-2 gap-4 text-[11px]">
                                        {columns.slice(0, 4).map((col, i) => {
                                            if (col.header.toLowerCase() === 'no') return null;
                                            const val = (typeof col.accessor === 'function' ? col.accessor(item, rowIndex) : item[col.accessor]) as unknown as React.ReactNode;
                                            // Don't repeat the name/nama since it's in the title
                                            if (String(val) === itemName) return null;

                                            return (
                                                <div key={i} className="min-w-0">
                                                    <p className="text-gray-400 dark:text-slate-500 mb-0.5 font-medium uppercase tracking-[0.05em] truncate">
                                                        {col.header}
                                                    </p>
                                                    <p className="font-semibold text-gray-800 dark:text-slate-200 truncate" title={String(val)}>
                                                        {val || '-'}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <PermissionGuard resource={RESOURCES.MASTER_DATA} action={ACTIONS.DELETE}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(item);
                                            }}
                                            className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 transition-colors shadow-sm"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </PermissionGuard>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full text-center py-20 text-gray-500 bg-white dark:bg-slate-800 rounded-xl border-2 border-dashed border-gray-100 dark:border-slate-700">
                        <span className="material-symbols-outlined text-6xl mb-4 opacity-20 whitespace-normal">inventory_2</span>
                        <p>Tidak ada data ditemukan</p>
                    </div>
                )}
            </div>
        );
    }

    // List View with Density adjustments
    return (
        <div className={`${transparent
            ? 'bg-transparent shadow-none border-0'
            : 'bg-white rounded-xl shadow-sm border border-gray-100'
            } overflow-hidden ${showBorders ? 'border-2' : ''}`}>
            <div className="overflow-x-auto">
                <table className="min-w-full whitespace-nowrap text-left text-sm">
                    <thead className="bg-gray-50 text-gray-900 font-semibold">
                        <tr>
                            {columns.map((col, idx) => (
                                <th key={idx} scope="col" className={`px-6 ${isCompact ? 'py-2' : 'py-4'} ${showBorders ? 'border-r border-gray-200' : ''}`}>
                                    {col.header}
                                </th>
                            ))}
                            <th scope="col" className={`px-6 ${isCompact ? 'py-2' : 'py-4'} text-right`}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.length > 0 ? (
                            data.map((item, rowIndex) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                                    {columns.map((col, colIdx) => (
                                        <td key={colIdx} className={`px-6 ${isCompact ? 'py-2' : 'py-4'} text-gray-700 ${showBorders ? 'border-r border-gray-100' : ''}`}>
                                            {typeof col.accessor === 'function'
                                                ? col.accessor(item, rowIndex)
                                                : (item[col.accessor] as React.ReactNode)}
                                        </td>
                                    ))}
                                    <td className={`px-6 ${isCompact ? 'py-2' : 'py-4'} text-right`}>
                                        <div className="flex items-center justify-end gap-2">
                                            <PermissionGuard resource={RESOURCES.MASTER_DATA} action={ACTIONS.UPDATE}>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className={`!p-1.5 text-blue-600 hover:bg-blue-50 border-blue-100 ${isCompact ? 'h-7 w-7' : ''}`}
                                                    onClick={() => onEdit(item)}
                                                >
                                                    <PencilSquareIcon className="w-4 h-4" />
                                                </Button>
                                            </PermissionGuard>
                                            <PermissionGuard resource={RESOURCES.MASTER_DATA} action={ACTIONS.DELETE}>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className={`!p-1.5 text-red-600 hover:bg-red-50 border-red-100 ${isCompact ? 'h-7 w-7' : ''}`}
                                                    onClick={() => onDelete(item)}
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </Button>
                                            </PermissionGuard>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-gray-500">
                                    Tidak ada data untuk ditampilkan
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {pagination && (
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        disabled={pagination.page === 1}
                        onClick={() => pagination.onPageChange(pagination.page - 1)}
                        className="!px-3"
                    >
                        <ChevronLeftIcon className="w-4 h-4" />
                    </Button>
                    <span className="flex items-center px-3 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-200">
                        Halaman {pagination.page}
                    </span>
                    <Button
                        variant="secondary"
                        size="sm"
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() => pagination.onPageChange(pagination.page + 1)}
                        className="!px-3"
                    >
                        <ChevronRightIcon className="w-4 h-4" />
                    </Button>
                </div>
            )}

        </div >
    );
};

export default MasterDataTable;
