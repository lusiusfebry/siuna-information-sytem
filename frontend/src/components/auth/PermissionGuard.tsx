import React from 'react';
import { usePermission } from '../../hooks/usePermission';
import { Navigate } from 'react-router-dom';

interface PermissionGuardProps {
    resource: string;
    action: string;
    children: React.ReactNode;
    fallback?: React.ReactNode; // Optional fallback UI instead of redirect/null
    redirectTo?: string; // Optional redirect path
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
    resource,
    action,
    children,
    fallback = null,
    redirectTo
}) => {
    const { can } = usePermission();

    if (!can(resource, action)) {
        if (redirectTo) {
            return <Navigate to={redirectTo} replace />;
        }
        return <>{fallback}</>;
    }

    return <>{children}</>;
};
