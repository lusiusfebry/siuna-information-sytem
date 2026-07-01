import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/api/dashboard.service';

export const useDashboardStats = () => {
    return useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const response = await dashboardService.getStats();
            return response.data.data;
        },
        refetchInterval: 60000, // Refresh every minute
    });
};

export const useEmployeeDistribution = () => {
    return useQuery({
        queryKey: ['employee-distribution'],
        queryFn: async () => {
            const response = await dashboardService.getDistribution();
            return response.data.data;
        },
        refetchInterval: 60000,
    });
};

export const useRecentActivities = () => {
    return useQuery({
        queryKey: ['recent-activities'],
        queryFn: async () => {
            const response = await dashboardService.getActivities();
            return response.data.data;
        },
        refetchInterval: 60000,
    });
};

export const useEmploymentStatus = () => {
    return useQuery({
        queryKey: ['employment-status'],
        queryFn: async () => {
            const response = await dashboardService.getEmploymentStatus();
            return response.data.data;
        },
        refetchInterval: 60000,
    });
};
