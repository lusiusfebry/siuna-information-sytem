import { Employee } from './hr';
import { Role } from './permission';

export interface User {
    id: number;
    nik: string;
    role_id: number | null;
    roleDetails?: Role;
    employee: Employee | null;
    is_active: boolean;
    last_login: string | null;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    setLoading: (isLoading: boolean) => void;
    setUser: (user: User) => void;
    // Permission helpers
    hasPermission: (resource: string, action: string) => boolean;
    isLoadingPermissions: boolean;
}
