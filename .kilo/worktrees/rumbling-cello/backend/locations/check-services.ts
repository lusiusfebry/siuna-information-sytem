
import dashboardService from '../src/modules/hr/services/dashboard.service';

async function check() {
    console.log('Dashboard Service imported successfully');
    try {
        const stats = await dashboardService.getDashboardStats();
        console.log('Stats:', stats);
    } catch (e) {
        console.error('Error fetching stats:', e);
    }
}

check();
