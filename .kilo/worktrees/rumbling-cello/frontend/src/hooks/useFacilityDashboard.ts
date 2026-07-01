import { useQuery } from '@tanstack/react-query';
import facilityDashboardService from '../services/api/facility-dashboard.service';

export const useFacilityDashboardSummary = () => {
    return useQuery({
        queryKey: ['facilityDashboard', 'summary'],
        queryFn: () => facilityDashboardService.getSummary(),
        staleTime: 5 * 60 * 1000,
    });
};
