import api from './client';
import { LoginInput } from '../../schemas/auth.schema';
import { User } from '../../types/auth'; // We need to define this type, let's assume it goes to types/auth.ts or I create it inline/separate

// Let's create types/auth.ts content here effectively or just use any for now but plan says separate. 
// I will create types/auth.ts separately, assuming it exists for this file.

export interface AuthResponse {
    status: string;
    data: {
        user: User;
        token: string;
    };
}

export const authService = {
    login: async (credentials: LoginInput) => {
        const response = await api.post<AuthResponse>('/auth/login', credentials);
        return response.data;
    },

    getCurrentUser: async () => {
        const response = await api.get<{ status: string; data: { user: User } }>('/auth/me');
        return response.data;
    },

    logout: async () => {
        const response = await api.post('/auth/logout');
        return response.data;
    },
};
