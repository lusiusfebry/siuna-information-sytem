import React from 'react';
import { Employee } from '../../types/hr';
import EmployeeCard from './EmployeeCard';

interface EmployeeGridProps {
    employees: Employee[];
    hasNextPage: boolean;
    isNextPageLoading: boolean;
    loadNextPage: () => Promise<void>;
    onRowClick: (employee: Employee) => void;
    onDelete?: (id: number) => void;
}

const EmployeeGrid: React.FC<EmployeeGridProps> = ({
    employees,
    hasNextPage,
    isNextPageLoading,
    loadNextPage,
    onRowClick,
    onDelete,
}) => {
    // Scroll handler for infinite loading
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight * 1.5) {
            if (!isNextPageLoading && hasNextPage) {
                loadNextPage();
            }
        }
    };

    return (
        <div
            className="h-full overflow-y-auto pr-2 custom-scrollbar"
            onScroll={handleScroll}
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8 p-2">
                {employees.map((employee) => (
                    <EmployeeCard
                        key={employee.id}
                        employee={employee}
                        onClick={onRowClick}
                        onDelete={onDelete}
                    />
                ))}

                {isNextPageLoading && (
                    <>
                        {[1, 2, 3, 4].map((i) => (
                            <div key={`skeleton-${i}`} className="animate-pulse bg-gray-100 dark:bg-slate-800 rounded-xl h-40"></div>
                        ))}
                    </>
                )}

                {!isNextPageLoading && hasNextPage && (
                    <div className="col-span-full py-4 flex justify-center">
                        <button
                            onClick={() => loadNextPage()}
                            className="text-primary hover:text-blue-700 font-medium text-sm flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined animate-spin">refresh</span>
                            Memuat lebih banyak...
                        </button>
                    </div>
                )}
            </div>

            {!hasNextPage && employees.length > 0 && (
                <p className="text-center text-gray-500 text-sm py-8 border-t border-gray-100 dark:border-slate-800">
                    Semua data telah ditampilkan.
                </p>
            )}

            {employees.length === 0 && !isNextPageLoading && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                    <span className="material-symbols-outlined text-6xl mb-4 opacity-20">group</span>
                    <p>Tidak ada data karyawan ditemukan.</p>
                </div>
            )}
        </div>
    );
};

export default EmployeeGrid;
