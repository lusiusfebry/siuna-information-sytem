
import React, { useState, useEffect } from 'react';
import { useMasterDataList } from '../../hooks/useMasterData';
import { SearchableSelect } from '../common/SearchableSelect';
import { Disclosure, Transition } from '@headlessui/react';
import { ChevronUpIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { EmployeeFilterParams, Department, Divisi, PosisiJabatan, StatusKaryawan, LokasiKerja, Tag } from '../../types/hr';

interface AdvancedEmployeeFilterProps {
    filters: EmployeeFilterParams;
    onFilterChange: (newFilters: EmployeeFilterParams) => void;
    onReset: () => void;
}

export const AdvancedEmployeeFilter: React.FC<AdvancedEmployeeFilterProps> = ({
    filters,
    onFilterChange,
    onReset
}) => {
    const { data: divisiList } = useMasterDataList('divisi');
    const { data: deptList } = useMasterDataList('department');
    const { data: posisiList } = useMasterDataList('posisi_jabatan');
    const { data: statusList } = useMasterDataList('status_karyawan');
    const { data: lokasiList } = useMasterDataList('lokasi_kerja');
    const { data: tagList } = useMasterDataList('tag');

    const [filteredDepts, setFilteredDepts] = useState<Department[]>([]);

    useEffect(() => {
        if (filters.divisi_id) {
            setFilteredDepts((deptList?.data as Department[])?.filter((d) => d.divisi_id === filters.divisi_id) || []);
        } else {
            setFilteredDepts((deptList?.data as Department[]) || []);
        }
    }, [filters.divisi_id, deptList]);

    const handleChange = (field: keyof EmployeeFilterParams, value: number | undefined) => {
        onFilterChange({ ...filters, [field]: value });
    };

    return (
        <div className="bg-white shadow rounded-lg mb-4">
            <Disclosure>
                {({ open }) => (
                    <>
                        <Disclosure.Button className="flex w-full justify-between rounded-lg bg-gray-50 px-4 py-3 text-left text-sm font-medium text-gray-900 hover:bg-gray-100 focus:outline-none focus-visible:ring focus-visible:ring-indigo-500/75">
                            <div className="flex items-center gap-2">
                                <FunnelIcon className="h-5 w-5 text-gray-500" />
                                <span>Advanced Filter</span>
                                {Object.keys(filters).length > 0 && (
                                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                        {Object.keys(filters).length} Aktif
                                    </span>
                                )}
                            </div>
                            <ChevronUpIcon
                                className={`${open ? 'rotate-180 transform' : ''} h-5 w-5 text-gray-500`}
                            />
                        </Disclosure.Button>
                        <Transition
                            enter="transition duration-100 ease-out"
                            enterFrom="transform scale-95 opacity-0"
                            enterTo="transform scale-100 opacity-100"
                            leave="transition duration-75 ease-out"
                            leaveFrom="transform scale-100 opacity-100"
                            leaveTo="transform scale-95 opacity-0"
                        >
                            <Disclosure.Panel className="p-4 text-gray-500 border-t border-gray-100">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <SearchableSelect
                                        label="Divisi"
                                        options={(divisiList?.data as Divisi[])?.map((d) => ({ value: d.id, label: d.nama })) || []}
                                        value={filters.divisi_id}
                                        onChange={(val) => handleChange('divisi_id', val as number)}
                                        placeholder="Pilih Divisi"
                                    />
                                    <SearchableSelect
                                        label="Departemen"
                                        options={filteredDepts.map((d) => ({ value: d.id, label: d.nama }))}
                                        value={filters.department_id}
                                        onChange={(val) => handleChange('department_id', val as number)}
                                        placeholder="Pilih Departemen"
                                        disabled={!filters.divisi_id && filteredDepts.length === 0}
                                    />
                                    <SearchableSelect
                                        label="Posisi Jabatan"
                                        options={(posisiList?.data as PosisiJabatan[])?.map((p) => ({ value: p.id, label: p.nama })) || []}
                                        value={filters.posisi_jabatan_id}
                                        onChange={(val) => handleChange('posisi_jabatan_id', val as number)}
                                        placeholder="Pilih Posisi"
                                    />
                                    <SearchableSelect
                                        label="Status Karyawan"
                                        options={(statusList?.data as StatusKaryawan[])?.map((s) => ({ value: s.id, label: s.nama })) || []}
                                        value={filters.status_karyawan_id}
                                        onChange={(val) => handleChange('status_karyawan_id', val as number)}
                                        placeholder="Pilih Status"
                                    />
                                    <SearchableSelect
                                        label="Lokasi Kerja"
                                        options={(lokasiList?.data as LokasiKerja[])?.map((l) => ({ value: l.id, label: l.nama })) || []}
                                        value={filters.lokasi_kerja_id}
                                        onChange={(val) => handleChange('lokasi_kerja_id', val as number)}
                                        placeholder="Pilih Lokasi"
                                    />
                                    <SearchableSelect
                                        label="Tag"
                                        options={(tagList?.data as Tag[])?.map((t) => ({ value: t.id, label: t.nama })) || []}
                                        value={filters.tag_id}
                                        onChange={(val) => handleChange('tag_id', val as number)}
                                        placeholder="Pilih Tag"
                                    />
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <button
                                        type="button"
                                        className="text-sm text-gray-600 hover:text-gray-900 underline"
                                        onClick={onReset}
                                    >
                                        Reset Filter
                                    </button>
                                </div>
                            </Disclosure.Panel>
                        </Transition>
                    </>
                )}
            </Disclosure>
        </div>
    );
};
