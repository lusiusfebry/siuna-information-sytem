import api from './api/client';

export const validationService = {
    checkNIKUnique: async (nik: string, excludeId?: number): Promise<boolean> => {
        try {
            // Use existing employee list endpoint to filter by NIK
            // Assuming the search param works for NIK
            const response = await api.get('/hr/employees', {
                params: {
                    search: nik,
                    limit: 1
                }
            });

            const employees = response.data.data;
            if (employees.length === 0) return true;

            // Check exact match and exclude ID
            const match = employees.find((e: { nomor_induk_karyawan: string; id: number }) => e.nomor_induk_karyawan === nik);
            if (!match) return true;

            if (excludeId && match.id === excludeId) return true;

            return false;
        } catch (error) {
            console.error('Failed to check NIK uniqueness', error);
            // Default to true to not block user if API fails? Or false? Safety first -> False?
            // User experience -> True allows submit, backend will catch it.
            return true;
        }
    },

    // Additional validations that might need server verification
    validateDepartmentDivisi: async (departmentId: number, divisiId: number): Promise<boolean> => {
        // Can be improved by dedicated endpoint, or just fetching dept details
        try {
            // We can use the generic master data endpoint
            const response = await api.get(`/hr/master/department/${departmentId}`);
            const dept = response.data.data;
            return dept && dept.divisi_id === divisiId;
        } catch (e) {
            return false;
        }
    }
};
