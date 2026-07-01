import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { employeeStep3Schema, EmployeeStep3FormValues } from '../../schemas/employee.schema';
import Input from '../common/Input';
import Button from '../common/Button';
import {
    UserGroupIcon,
    UsersIcon,
    PlusCircleIcon,
    TrashIcon,
    HeartIcon
} from '@heroicons/react/24/outline';

interface EmployeeStep3FormProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialData?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    headData?: any;
    onNext: (data: EmployeeStep3FormValues) => void;
    onSaveDraft?: (data: Partial<EmployeeStep3FormValues>) => void;
    onBack: () => void;
}

export const EmployeeStep3Form: React.FC<EmployeeStep3FormProps> = ({ initialData, headData, onNext, onSaveDraft, onBack }) => {
    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        getValues,
        formState: { errors }
    } = useForm<EmployeeStep3FormValues>({
        resolver: zodResolver(employeeStep3Schema),
        defaultValues: {
            ...initialData,
            // Pre-populate specific fields if needed, though most come from initialData (FormData from wizard)
            data_anak: initialData?.data_anak || [],
            data_saudara_kandung: initialData?.data_saudara_kandung || []
        }
    });

    const { fields: anakFields, append: appendAnak, remove: removeAnak, replace: replaceAnak } = useFieldArray({
        control,
        name: "data_anak"
    });

    const { fields: saudaraFields, append: appendSaudara, remove: removeSaudara } = useFieldArray({
        control,
        name: "data_saudara_kandung"
    });

    const watchAnak = watch("data_anak");
    const watchSaudara = watch("data_saudara_kandung");

    // Pre-populate children if empty and jumlah_anak is set in Step 1
    React.useEffect(() => {
        if (headData?.jumlah_anak) {
            setValue('jumlah_anak_step1', Number(headData.jumlah_anak));

            if (headData.jumlah_anak > 0 && anakFields.length === 0) {
                const count = Number(headData.jumlah_anak);
                const initialChildren = Array(count).fill({
                    nama: '',
                    jenis_kelamin: 'Laki-laki',
                    tanggal_lahir: '',
                    keterangan: ''
                });
                replaceAnak(initialChildren);
            }
        }
    }, [headData?.jumlah_anak, setValue, anakFields.length, replaceAnak]);

    const maxAnak = headData?.jumlah_anak ? Number(headData.jumlah_anak) : 100;

    const onSubmit = (data: EmployeeStep3FormValues) => {
        onNext(data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

            {/* Section 1: Pasangan & Anak */}
            <div className="bg-white border rounded-lg p-6 shadow-sm">
                <h4 className="flex items-center text-lg font-medium text-gray-900 mb-4 border-b pb-2">
                    <HeartIcon className="w-5 h-5 mr-2 text-primary-600" />
                    Pasangan & Data Anak
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Read-Only from Step 1 */}
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status Pernikahan</label>
                        <input
                            disabled
                            value={headData?.status_pernikahan || '-'}
                            className="bg-gray-100 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-gray-500"
                        />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pasangan</label>
                        <input
                            disabled
                            value={headData?.nama_pasangan || '-'}
                            className="bg-gray-100 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-gray-500"
                        />
                    </div>

                    <Input type="date" label="Tanggal Lahir Pasangan" {...register('tanggal_lahir_pasangan')} error={errors.tanggal_lahir_pasangan?.message} />
                    <Input label="Pendidikan Terakhir Pasangan" {...register('pendidikan_terakhir_pasangan')} error={errors.pendidikan_terakhir_pasangan?.message} />

                    {/* Read Only Job */}
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pekerjaan Pasangan</label>
                        <input
                            disabled
                            value={headData?.pekerjaan_pasangan || '-'}
                            className="bg-gray-100 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-gray-500"
                        />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Anak (Sesuai KK)</label>
                        <input
                            disabled
                            value={headData?.jumlah_anak || '0'}
                            className="bg-gray-100 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm text-gray-500"
                        />
                    </div>

                    <div className="col-span-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan Pasangan</label>
                        <textarea
                            {...register('keterangan_pasangan')}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            rows={2}
                        />
                    </div>
                </div>

                <hr className="my-6 border-gray-200" />

                {/* Data Anak (Repeatable) */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h5 className="text-md font-medium text-gray-800">Data Anak</h5>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={anakFields.length >= maxAnak}
                            onClick={() => appendAnak({ nama: '', jenis_kelamin: 'Laki-laki', tanggal_lahir: '', keterangan: '' })}
                            className="flex items-center text-xs"
                        >
                            <PlusCircleIcon className="w-4 h-4 mr-1" />
                            Tambah Anak {anakFields.length}/{maxAnak !== 100 ? maxAnak : 'Unl'}
                        </Button>
                    </div>

                    {anakFields.length === 0 && (
                        <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                            <p className="text-gray-500 text-sm">Belum ada data anak. Klik tombol diatas untuk menambahkan.</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        {anakFields.map((field, index) => (
                            <div key={field.id} className="relative group p-4 border rounded-lg bg-gray-50 hover:border-primary-200 transition-colors">
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        type="button"
                                        onClick={() => removeAnak(index)}
                                        className="text-red-500 hover:text-red-700 bg-white rounded-full p-1 shadow-sm"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                                <span className="absolute -top-3 left-4 bg-white px-2 text-xs font-semibold text-gray-500 border rounded">
                                    Anak ke-{index + 1}
                                </span>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                                    <Input
                                        label="Nama Anak"
                                        {...register(`data_anak.${index}.nama`)}
                                        error={errors.data_anak?.[index]?.nama?.message}
                                        placeholder="Nama Lengkap"
                                        autoTitleCase={true}
                                    />
                                    <div className="space-y-1">
                                        <label className="block text-sm font-medium text-gray-700">Jenis Kelamin</label>
                                        <select
                                            {...register(`data_anak.${index}.jenis_kelamin`)}
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                        >
                                            <option value="Laki-laki">Laki-laki</option>
                                            <option value="Perempuan">Perempuan</option>
                                        </select>
                                    </div>
                                    <Input
                                        type="date"
                                        label="Tanggal Lahir"
                                        {...register(`data_anak.${index}.tanggal_lahir`)}
                                        error={errors.data_anak?.[index]?.tanggal_lahir?.message}
                                    />
                                    <Input
                                        label="Keterangan"
                                        {...register(`data_anak.${index}.keterangan`)}
                                        placeholder="Contoh: SD Kelas 1"
                                        autoTitleCase={true}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Section 2: Orang Tua & Mertua */}
            <div className="bg-white border rounded-lg p-6 shadow-sm">
                <h4 className="flex items-center text-lg font-medium text-gray-900 mb-4 border-b pb-2">
                    <UsersIcon className="w-5 h-5 mr-2 text-primary-600" />
                    Orang Tua & Mertua
                </h4>

                {/* Orang Tua Kandung */}
                <div className="mb-6">
                    <h5 className="font-medium text-gray-700 mb-3 bg-gray-50 p-2 rounded">Orang Tua Kandung</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Nama Ayah Kandung" {...register('nama_ayah_kandung')} autoTitleCase={true} />
                        <Input label="Nama Ibu Kandung" {...register('nama_ibu_kandung')} autoTitleCase={true} />
                        <div className="col-span-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Orang Tua</label>
                            <textarea
                                {...register('alamat_orang_tua')}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                rows={2}
                            />
                        </div>
                    </div>
                </div>

                {/* Mertua */}
                <div>
                    <h5 className="font-medium text-gray-700 mb-3 bg-gray-50 p-2 rounded">Mertua</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Ayah Mertua */}
                        <div className="col-span-full md:col-span-1 space-y-3 pr-2 border-r-0 md:border-r border-gray-100">
                            <p className="text-xs font-semibold text-gray-500 uppercase">Ayah Mertua</p>
                            <Input label="Nama" {...register('nama_ayah_mertua')} autoTitleCase={true} />
                            <Input type="date" label="Tanggal Lahir" {...register('tanggal_lahir_ayah_mertua')} />
                            <Input label="Pendidikan Terakhir" {...register('pendidikan_terakhir_ayah_mertua')} />
                            <Input label="Keterangan" {...register('keterangan_ayah_mertua')} />
                        </div>
                        {/* Ibu Mertua */}
                        <div className="col-span-full md:col-span-1 space-y-3 pl-0 md:pl-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase">Ibu Mertua</p>
                            <Input label="Nama" {...register('nama_ibu_mertua')} autoTitleCase={true} />
                            <Input type="date" label="Tanggal Lahir" {...register('tanggal_lahir_ibu_mertua')} />
                            <Input label="Pendidikan Terakhir" {...register('pendidikan_terakhir_ibu_mertua')} />
                            <Input label="Keterangan" {...register('keterangan_ibu_mertua')} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 3: Saudara Kandung */}
            <div className="bg-white border rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4 border-b pb-2">
                    <h4 className="flex items-center text-lg font-medium text-gray-900">
                        <UserGroupIcon className="w-5 h-5 mr-2 text-primary-600" />
                        Saudara Kandung
                    </h4>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            if (saudaraFields.length < 5) {
                                appendSaudara({
                                    nama: '',
                                    jenis_kelamin: 'Laki-laki',
                                    tanggal_lahir: '',
                                    pendidikan_terakhir: '',
                                    pekerjaan: '',
                                    keterangan: ''
                                });
                            }
                        }}
                        disabled={saudaraFields.length >= 5}
                        className="flex items-center text-xs"
                    >
                        <PlusCircleIcon className="w-4 h-4 mr-1" />
                        Tambah Saudara {saudaraFields.length}/5
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <Input type="number" label="Anak Ke-" {...register('anak_ke')} />
                    <Input type="number" label="Jumlah Saudara Kandung" {...register('jumlah_saudara_kandung')} />
                </div>

                {saudaraFields.length === 0 && (
                    <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                        <p className="text-gray-500 text-sm">Belum ada data saudara. Klik tombol diatas untuk menambahkan (Max 5).</p>
                    </div>
                )}

                <div className="space-y-4">
                    {saudaraFields.map((field, index) => (
                        <div key={field.id} className="relative group p-4 border rounded-lg bg-gray-50 hover:border-primary-200 transition-colors">
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    type="button"
                                    onClick={() => removeSaudara(index)}
                                    className="text-red-500 hover:text-red-700 bg-white rounded-full p-1 shadow-sm"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                            <span className="absolute -top-3 left-4 bg-white px-2 text-xs font-semibold text-gray-500 border rounded">
                                Saudara ke-{index + 1}
                            </span>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                                <Input
                                    label="Nama"
                                    {...register(`data_saudara_kandung.${index}.nama`)}
                                    error={errors.data_saudara_kandung?.[index]?.nama?.message}
                                    autoTitleCase={true}
                                />
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-700">Jenis Kelamin</label>
                                    <select
                                        {...register(`data_saudara_kandung.${index}.jenis_kelamin`)}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                    >
                                        <option value="Laki-laki">Laki-laki</option>
                                        <option value="Perempuan">Perempuan</option>
                                    </select>
                                </div>
                                <Input
                                    type="date"
                                    label="Tanggal Lahir"
                                    {...register(`data_saudara_kandung.${index}.tanggal_lahir`)}
                                    error={errors.data_saudara_kandung?.[index]?.tanggal_lahir?.message}
                                />
                                <Input
                                    label="Pendidikan"
                                    {...register(`data_saudara_kandung.${index}.pendidikan_terakhir`)}
                                />
                                <Input
                                    label="Pekerjaan"
                                    {...register(`data_saudara_kandung.${index}.pekerjaan`)}
                                    autoTitleCase={true}
                                />
                                <Input
                                    label="Keterangan"
                                    {...register(`data_saudara_kandung.${index}.keterangan`)}
                                    autoTitleCase={true}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Summary & Footer */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="text-sm text-blue-800">
                        <span className="font-semibold">Ringkasan:</span> {watchAnak?.length || 0} Anak, {watchSaudara?.length || 0} Saudara Kandung
                    </div>
                </div>
                <div className="text-xs text-blue-600 italic">
                    * Pastikan data sesuai dengan Kartu Keluarga (KK)
                </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-6 -mb-6 flex justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                <div>
                    {onSaveDraft && (
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => onSaveDraft(getValues())}
                            className="border-amber-300 text-amber-700 hover:bg-amber-50"
                        >
                            <span className="material-symbols-outlined text-[18px] mr-2">draft</span>
                            Simpan Draft
                        </Button>
                    )}
                </div>
                <div className="flex space-x-3">
                    <Button variant="outline" type="button" onClick={onBack}>
                        Kembali
                    </Button>
                    <Button variant="primary" type="submit" className="flex items-center">
                        <span className="mr-2">Simpan Seluruh Data</span>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                        </svg>
                    </Button>
                </div>
            </div>
        </form>
    );
};
