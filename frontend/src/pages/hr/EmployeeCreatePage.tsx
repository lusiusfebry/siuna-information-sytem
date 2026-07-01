import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EmployeeWizard } from '../../components/hr/EmployeeWizard';
import { employeeService } from '../../services/api/employee.service';
import toast from 'react-hot-toast';

const EmployeeCreatePage: React.FC = () => {
    const navigate = useNavigate();

    const handleComplete = async (formData: FormData) => {
        try {
            await employeeService.createEmployee(formData);
            toast.success('Karyawan berhasil dibuat');
            navigate('/hr/employees');
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error('Failed to create employee:', error);
            const message = error.response?.data?.message || 'Gagal membuat karyawan';
            toast.error(message);
        }
    };

    const handleCancel = () => {
        navigate('/hr/employees');
    };

    // Save as Draft handler - saves incomplete employee data
    const handleSaveDraft = async (formData: FormData) => {
        try {
            await employeeService.createEmployee(formData);
            toast.success('Draft karyawan berhasil disimpan');
            navigate('/hr/employees?is_draft=true');
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error('Failed to save draft:', error);
            const message = error.response?.data?.message || 'Gagal menyimpan draft';
            toast.error(message);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Tambah Karyawan Baru</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Lengkapi data karyawan melalui wizard berikut.
                </p>
            </div>

            <EmployeeWizard
                onComplete={handleComplete}
                onSaveDraft={handleSaveDraft}
                onCancel={handleCancel}
            />
        </div>
    );
};

export default EmployeeCreatePage;
