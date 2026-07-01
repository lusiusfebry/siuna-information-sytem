import api from './client';

const BASE_URL = '/hr/employees';

export const employeeService = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getAllEmployees: async (params?: any) => {
        const response = await api.get(BASE_URL, { params });
        return response.data;
    },

    getEmployee: async (id: number) => {
        const response = await api.get(`${BASE_URL}/${id}`);
        return response.data.data;
    },

    getEmployeeBase: async (id: number) => {
        const response = await api.get(`${BASE_URL}/${id}/base`);
        return response.data.data;
    },

    getEmployeePersonal: async (id: number) => {
        const response = await api.get(`${BASE_URL}/${id}/personal`);
        return response.data.data;
    },

    getEmployeeEmployment: async (id: number) => {
        const response = await api.get(`${BASE_URL}/${id}/employment`);
        return response.data.data;
    },

    getEmployeeFamily: async (id: number) => {
        const response = await api.get(`${BASE_URL}/${id}/family`);
        return response.data.data;
    },

    createEmployee: async (formData: FormData) => {
        const response = await api.post(BASE_URL, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.data;
    },

    updateEmployee: async (id: number, formData: FormData) => {
        const response = await api.put(`${BASE_URL}/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.data;
    },

    deleteEmployee: async (id: number) => {
        await api.delete(`${BASE_URL}/${id}`);
    }
};
