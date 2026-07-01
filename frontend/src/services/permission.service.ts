import api from './api/client';
import { Permission, Role } from '../types/permission';

class PermissionService {
    async getAllRoles(): Promise<Role[]> {
        const response = await api.get('/auth/roles');
        return response.data.data;
    }

    async getRoleById(id: number): Promise<Role> {
        const response = await api.get(`/auth/roles/${id}`);
        return response.data.data;
    }

    async createRole(data: Partial<Role>): Promise<Role> {
        const response = await api.post('/auth/roles', data);
        return response.data.data;
    }

    async updateRole(id: number, data: Partial<Role>): Promise<Role> {
        const response = await api.put(`/auth/roles/${id}`, data);
        return response.data.data;
    }

    async deleteRole(id: number): Promise<void> {
        await api.delete(`/auth/roles/${id}`);
    }

    async getAllPermissions(): Promise<Permission[]> {
        const response = await api.get('/auth/permissions');
        return response.data.data;
    }

    // Helper to check permission on client side if we have the list
    checkPermission(userPermissions: Permission[], resource: string, action: string): boolean {
        return userPermissions.some(p => p.resource === resource && p.action === action);
    }
}

export default new PermissionService();
