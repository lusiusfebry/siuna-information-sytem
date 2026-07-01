import cron from 'node-cron';
import auditService from '../../modules/hr/services/audit.service';
import { env } from '../../config/env';

// Default retention 365 days
const RETENTION_DAYS = env.auditLogRetentionDays;
const CRON_SCHEDULE = process.env.AUDIT_LOG_CLEANUP_CRON || '0 2 * * *'; // Default 2 AM

export const initScheduler = () => {
    console.log('Initializing Scheduler...');
    console.log(`Audit Log Cleanup scheduled at: ${CRON_SCHEDULE}, Retention: ${RETENTION_DAYS} days`);

    cron.schedule(CRON_SCHEDULE, async () => {
        console.log('Running daily audit log cleanup...');
        try {
            const count = await auditService.cleanupOldLogs(RETENTION_DAYS);
            console.log(`Audit log cleanup completed. Deleted ${count} old records.`);
        } catch (error) {
            console.error('Audit log cleanup failed:', error);
        }
    });
};
