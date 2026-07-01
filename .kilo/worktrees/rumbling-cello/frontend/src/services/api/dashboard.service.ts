import api from './client';

export const dashboardService = {
    getStats: () => api.get('/hr/dashboard/stats'),
    getDistribution: () => api.get('/hr/dashboard/distribution'),
    getActivities: () => api.get('/hr/dashboard/activities'),
    getEmploymentStatus: () => api.get('/hr/dashboard/employment-status'),
};
