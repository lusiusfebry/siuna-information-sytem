import React from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import AutoSizer from 'react-virtualized-auto-sizer';

interface Employee {
    id: number;
    nama_lengkap: string;
    nomor_induk_karyawan: string;
    foto_karyawan?: string;
    posisi_jabatan?: { nama: string };
    department?: { nama: string };
    is_draft?: boolean;
}

interface VirtualEmployeeTableProps {
    employees: Employee[];
    hasNextPage: boolean;
    isNextPageLoading: boolean;
    loadNextPage: () => Promise<void>;
    onRowClick: (employee: Employee) => void;
    onDelete?: (id: number) => void;
    showDraftBadge?: boolean;
}

const Row = ({ index, style, data }: ListChildComponentProps) => {
    const { employees, isItemLoaded, onRowClick, onDelete, showDraftBadge } = data;

    if (!isItemLoaded(index)) {
        return (
            <div style={style} className="flex items-center justify-center p-4 text-gray-500 border-b border-gray-100 dark:border-slate-700">
                Loading more...
            </div>
        );
    }

    const employee = employees[index];
    if (!employee) return null;

    return (
        <div
            style={style}
            className="flex items-center px-6 py-4 border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
            onClick={() => onRowClick(employee)}
        >
            <div className="w-12 shrink-0 text-xs font-bold text-gray-400 dark:text-gray-500">
                {index + 1}
            </div>
            <div className="flex items-center gap-3 flex-[2] min-w-0">
                <img
                    src={employee.foto_karyawan ? `http://localhost:3000${employee.foto_karyawan}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.nama_lengkap)}&background=random`}
                    alt={employee.nama_lengkap}
                    className="h-10 w-10 rounded-full object-cover border border-gray-200"
                    loading="lazy"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.nama_lengkap)}&background=random`;
                    }}
                />
                <div className="truncate">
                    <div className="font-medium text-gray-900 dark:text-gray-100 truncate flex items-center gap-2">
                        {employee.nama_lengkap}
                        {showDraftBadge && employee.is_draft && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                                Draft
                            </span>
                        )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{employee.nomor_induk_karyawan}</div>
                </div>
            </div>
            <div className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate px-2">{employee.posisi_jabatan?.nama || '-'}</div>
            <div className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate px-2">{employee.department?.nama || '-'}</div>
            <div className="w-20 flex justify-end">
                {onDelete && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(employee.id);
                        }}
                        className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                        title="Hapus Karyawan"
                    >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                )}
            </div>
        </div>
    );
};

const VirtualEmployeeTable: React.FC<VirtualEmployeeTableProps> = ({
    employees,
    hasNextPage,
    isNextPageLoading,
    loadNextPage,
    onRowClick,
    onDelete,
    showDraftBadge,
}) => {
    const itemCount = hasNextPage ? employees.length + 1 : employees.length;
    const isItemLoaded = React.useCallback((index: number) => !hasNextPage || index < employees.length, [hasNextPage, employees.length]);
    const loadMoreItems = isNextPageLoading ? () => Promise.resolve() : loadNextPage;

    const itemData = React.useMemo(() => ({
        employees,
        isItemLoaded,
        onRowClick,
        onDelete,
        showDraftBadge
    }), [employees, isItemLoaded, onRowClick, onDelete, showDraftBadge]);

    return (
        <div className="w-full bg-white dark:bg-slate-800 rounded-lg shadow border border-gray-200 dark:border-slate-700 h-[600px] flex flex-col">
            <div className="flex px-6 py-3 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 rounded-t-lg font-medium text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <div className="w-12 shrink-0">No</div>
                <div className="flex-[2]">Nama / NIK</div>
                <div className="flex-1 px-2">Posisi</div>
                <div className="flex-1 px-2">Department</div>
                <div className="w-20 text-right">Aksi</div>
            </div>

            <div className="flex-grow">
                <AutoSizer>
                    {({ height, width }) => (
                        <InfiniteLoader
                            isItemLoaded={isItemLoaded}
                            itemCount={itemCount}
                            loadMoreItems={loadMoreItems}
                            threshold={5}
                        >
                            {({ onItemsRendered, ref }) => (
                                <List
                                    className="custom-scrollbar"
                                    height={height}
                                    itemCount={itemCount}
                                    itemSize={80}
                                    onItemsRendered={onItemsRendered}
                                    ref={ref}
                                    width={width}
                                    itemData={itemData}
                                >
                                    {Row}
                                </List>
                            )}
                        </InfiniteLoader>
                    )}
                </AutoSizer>
            </div>
        </div>
    );
};

export default VirtualEmployeeTable;
