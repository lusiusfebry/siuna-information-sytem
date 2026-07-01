import client from './client';
import { FacilityDashboardSummary } from '../../types/facility';

const getSummary = async (): Promise<{ status: string; data: FacilityDashboardSummary }> => {
    const response = await client.get<{ status: string; data: FacilityDashboardSummary }>('/facility/dashboard/summary');
    return response.data;
};

const facilityDashboardService = {
    getSummary,
};

export default facilityDashboardService;
