import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EmployeeWizard } from '../../components/hr/EmployeeWizard';
import { employeeService } from '../../services/api/employee.service';
import toast from 'react-hot-toast';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { Employee } from '../../types/hr';

const EmployeeEditPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                if (!id) return;
                const data = await employeeService.getEmployee(parseInt(id));
                // Flatten data if needed, or pass as is.
                // If EmployeeWizard expects nested, good. If flat, we need to adjust types.
                // Assuming EmployeeWizard handles the object from API which is Employee type.
                // But we were flattening it before?
                // "const flatData = { ...data, ...data.personal_info };"
                // If we pass this to setEmployee which is Employee type, TS might complain if Employee doesn't have personal_info fields at root.
                // For now, let's cast it or just pass data if Wizard extracts it.
                // The Wizard's EmployeeStep1Form takes initialData.
                // If initialData is the full employee object, we need to map it to form values in the form or here.
                // EmployeeStep1Form uses `defaultValues: initialData`.
                // If keys match, it works.
                // Employee has `personal_info` object. Form has `tempat_lahir` at root?
                // No, Form uses `register('tempat_lahir')`.
                // So Form expects flat structure for personal info?
                // Wait, `EmployeeStep1Form.tsx` lines 182: `register('tempat_lahir')`.
                // So yes, it expects `tempat_lahir` at root level of `initialData`.
                // So we DO need to flatten it.
                // So `employee` state should be `any` or a specific FormValues type.
                // But to satisfy lint, let's use `any` with disable, OR define a type.
                // Using `any` with disable is safer for now to avoid refactoring types.

                const flatData = {
                    ...data,
                    ...data.personal_info,
                    ...data.hr_info,
                    ...data.family_info
                };

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setEmployee(flatData as any);
            } catch (error) {
                console.error('Failed to fetch employee:', error);
                toast.error('Gagal memuat data karyawan');
                navigate('/hr/employees');
            } finally {
                setLoading(false);
            }
        };

        fetchEmployee();
    }, [id, navigate]);

    const handleComplete = async (formData: FormData) => {
        try {
            if (!id) return;
            await employeeService.updateEmployee(parseInt(id), formData);
            toast.success('Karyawan berhasil diperbarui');
            navigate('/hr/employees');
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error('Failed to update employee:', error);
            // Handle validation errors with detailed messages
            const responseData = error.response?.data;
            if (responseData?.errors && Array.isArray(responseData.errors)) {
                // Show each validation error - handle both string and object formats
                responseData.errors.forEach((err: string | { field?: string; message: string }) => {
                    const errorMessage = typeof err === 'string' ? err : err.message;
                    toast.error(errorMessage);
                });

                // Add specific guidance for drafts
                if (employee?.is_draft) {
                    toast.success("💡 GUNAKAN TOMBOL 'SIMPAN DRAFT' (KUNING) DI BAWAH JIKA DATA BELUM LENGKAP.", { duration: 6000 });
                }
            } else {
                const message = responseData?.message || 'Gagal memperbarui karyawan';
                if (employee?.is_draft && message.includes('Validation')) {
                    toast.error(message);
                    toast.success("💡 GUNAKAN TOMBOL 'SIMPAN DRAFT' (KUNING) DI BAWAH JIKA DATA BELUM LENGKAP.", { duration: 6000 });
                } else {
                    toast.error(message);
                }
            }
        }
    };

    const handleCancel = () => {
        navigate('/hr/employees');
    };

    // Save as Draft handler for editing drafts
    const handleSaveDraft = async (formData: FormData) => {
        try {
            if (!id) return;
            await employeeService.updateEmployee(parseInt(id), formData);
            toast.success('Draft karyawan berhasil disimpan');
            navigate('/hr/employees?is_draft=true');
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error('Failed to save draft:', error);
            const responseData = error.response?.data;
            if (responseData?.errors && Array.isArray(responseData.errors)) {
                responseData.errors.forEach((err: string | { field?: string; message: string }) => {
                    const errorMessage = typeof err === 'string' ? err : err.message;
                    toast.error(errorMessage);
                });
            } else {
                const message = responseData?.message || 'Gagal menyimpan draft';
                toast.error(message);
            }
        }
    };

    if (loading) return <LoadingSkeleton />;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6">
                <nav className="flex mb-4" aria-label="Breadcrumb">
                    <ol className="flex items-center space-x-4">
                        <li>
                            <div className="flex items-center">
                                <a href="/hr/employees" className="text-sm font-medium text-gray-500 hover:text-gray-700">Karyawan</a>
                            </div>
                        </li>
                        <li>
                            <div className="flex items-center">
                                <svg className="flex-shrink-0 h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                    <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                                </svg>
                                <span className="ml-4 text-sm font-medium text-gray-500">Edit</span>
                            </div>
                        </li>
                        <li>
                            <div className="flex items-center">
                                <svg className="flex-shrink-0 h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                    <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                                </svg>
                                <span className="ml-4 text-sm font-medium text-gray-900" aria-current="page">{employee?.nama_lengkap}</span>
                            </div>
                        </li>
                    </ol>
                </nav>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {employee?.is_draft ? 'Lanjutkan Draft' : 'Edit Karyawan'}
                    </h1>
                    {employee?.is_draft && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            Draft
                        </span>
                    )}
                </div>
            </div>

            <EmployeeWizard
                initialData={employee || undefined}
                onComplete={handleComplete}
                onSaveDraft={employee?.is_draft ? handleSaveDraft : undefined}
                onCancel={handleCancel}
            />
        </div>
    );
};

export default EmployeeEditPage;
