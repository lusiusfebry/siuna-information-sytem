import { useAuthStore } from '../stores/authStore';
// import { Permission, Role } from '../types/permission';

export const usePermission = () => {
    const { user, hasPermission } = useAuthStore();

    const can = (resource: string, action: string): boolean => {
        return hasPermission(resource, action);
    };

    const is = (roleName: string): boolean => {
        return user?.roleDetails?.name === roleName;
    };

    return {
        can,
        is,
        user,
        role: user?.roleDetails,
        permissions: user?.roleDetails?.permissions || []
    };
};
