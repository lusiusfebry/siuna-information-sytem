import React from 'react';
import { usePermission } from '../../hooks/usePermission';
import { Navigate } from 'react-router-dom';

interface RoleGuardProps {
    roles: string[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
    redirectTo?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
    roles,
    children,
    fallback = null,
    redirectTo
}) => {
    const { is } = usePermission();

    // Check if user has ANY of the required roles
    const hasRole = roles.some(role => is(role));

    if (!hasRole) {
        if (redirectTo) {
            return <Navigate to={redirectTo} replace />;
        }
        return <>{fallback}</>;
    }

    return <>{children}</>;
};
