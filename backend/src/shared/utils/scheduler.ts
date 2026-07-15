import cron from 'node-cron';
import auditService from '../../modules/hr/services/audit.service';
import notificationService from '../services/notification.service';
import { env } from '../../config/env';

// Default retention 365 days
const RETENTION_DAYS = env.auditLogRetentionDays;
const CRON_SCHEDULE = process.env.AUDIT_LOG_CLEANUP_CRON || '0 2 * * *'; // Default 2 AM
const ASSET_REMINDER_CRON = env.assetReminder.cron;

export const initScheduler = () => {
    console.log('Initializing Scheduler...');
    console.log(`Audit Log Cleanup scheduled at: ${CRON_SCHEDULE}, Retention: ${RETENTION_DAYS} days`);
    console.log(`Asset Reminders scheduled at: ${ASSET_REMINDER_CRON}`);

    cron.schedule(CRON_SCHEDULE, async () => {
        console.log('Running daily audit log cleanup...');
        try {
            const count = await auditService.cleanupOldLogs(RETENTION_DAYS);
            console.log(`Audit log cleanup completed. Deleted ${count} old records.`);
        } catch (error) {
            console.error('Audit log cleanup failed:', error);
        }
    });

    // INV-N08: daily scan for assets stuck too long (damaged, employee custody,
    // facility placement) → notify inventory stakeholders. Dedup keeps it quiet.
    cron.schedule(ASSET_REMINDER_CRON, async () => {
        console.log('Running asset reminder scan...');
        try {
            await notificationService.checkAssetRemindersAndNotify();
        } catch (error) {
            console.error('Asset reminder scan failed:', error);
        }
    });
};
