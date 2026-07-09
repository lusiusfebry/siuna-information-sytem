import Employee from '../models/Employee';
import Department from '../models/Department';
import Divisi from '../models/Divisi';
import StatusKaryawan from '../models/StatusKaryawan';
import Leave from '../models/Leave';
import Attendance from '../models/Attendance';
import { Sequelize, Op } from 'sequelize';

class DashboardService {
    async getDashboardStats() {
        // Total (non-draft) employees. NOTE: StatusKaryawan.status is the master
        // row's own soft-delete flag, NOT the employment status — filtering on it
        // was a bug. Headcount = committed (non-draft) employee records.
        const totalEmployees = await Employee.count({
            where: { is_draft: false }
        });

        // Total Active Departments
        const totalDepartments = await Department.count();

        // Employees on Leave (Active Approved Leave today)
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const employeesOnLeave = await Leave.count({
            where: {
                status: 'Approved',
                tanggal_mulai: { [Op.lte]: today },
                tanggal_selesai: { [Op.gte]: today }
            }
        });

        // Attendance Rate (Present today / Total Employees). Attendance.tanggal is
        // a DATEONLY column, so compare against a YYYY-MM-DD string, not a JS Date
        // (a full Date with time never matches a DATEONLY value).
        const presentCount = await Attendance.count({
            where: {
                tanggal: today,
                status: 'Hadir'
            }
        });

        const attendanceRate = totalEmployees > 0
            ? Math.round((presentCount / totalEmployees) * 100)
            : 0;

        return {
            totalEmployees,
            totalDepartments,
            employeesOnLeave,
            attendanceRate
        };
    }

    async getEmployeeDistribution() {
        const distribution = await Employee.findAll({
            attributes: [
                [Sequelize.col('department.nama'), 'department_name'],
                [Sequelize.col('divisi.nama'), 'divisi_name'],
                [Sequelize.fn('COUNT', Sequelize.col('Employee.id')), 'employee_count']
            ],
            include: [
                { model: Department, as: 'department', attributes: [] },
                { model: Divisi, as: 'divisi', attributes: [] }
            ],
            group: ['department.id', 'divisi.id', 'department.nama', 'divisi.nama'],
            raw: true
        });

        return distribution;
    }

    async getRecentActivities() {
        const { default: AuditLog } = await import('../models/AuditLog');

        // Find recent interesting activities (CREATE/UPDATE/DELETE)
        const logs = await AuditLog.findAll({
            limit: 10,
            order: [['timestamp', 'DESC']],
            where: {
                action: { [Op.ne]: 'VIEW' }
            },
            include: [
                // If you want user photo, you might need to join with User -> Employee -> Foto
                // For now, let's assume User has 'name' or we use 'user_name' from log
            ]
        });

        // Current dashboard expects specific shape:
        // { nama_lengkap, foto_karyawan, department_name, status, createdAt }
        // We need to map AuditLog to this shape OR update Frontend to accept AuditLog shape.
        // The plan says: "Update RecentActivitiesTable in Dashboard... Add field action, entity_type..."
        // So we should return the AuditLog data but perhaps mapped slightly to be consumed easily.

        return logs.map((log: any) => ({
            id: log.id,
            user_name: log.user_name || 'System',
            user_photo: null, // Pending: Join with User.employee.foto_karyawan if available
            action: log.action,
            entity_type: log.entity_type,
            entity_name: log.entity_name,
            timestamp: log.timestamp,
            // Fallback fields for backward compatibility if frontend not yet updated (though we will update frontend)
            nama_lengkap: log.user_name || 'System',
            createdAt: log.timestamp
        }));
    }

    async getActivitySummary() {
        const { default: AuditLog } = await import('../models/AuditLog');

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const summary = await AuditLog.findAll({
            attributes: ['action', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
            where: {
                timestamp: { [Op.gte]: startOfDay }
            },
            group: ['action'],
            raw: true
        });

        return summary;
    }

    async getEmploymentStatusDistribution() {
        const distribution = await Employee.findAll({
            attributes: [
                [Sequelize.col('status_karyawan.nama'), 'status_name'],
                [Sequelize.fn('COUNT', Sequelize.col('Employee.id')), 'count']
            ],
            include: [
                { model: StatusKaryawan, as: 'status_karyawan', attributes: [] }
            ],
            group: ['status_karyawan.id', 'status_karyawan.nama'],
            raw: true
        });

        let tetapCount = 0;
        let kontrakCount = 0;
        let total = 0;

        (distribution as any[]).forEach(d => {
            const count = parseInt(d.count);
            total += count;
            if (d.status_name === 'Tetap' || d.status_name === 'PKWTT') tetapCount += count;
            else kontrakCount += count;
        });

        return {
            tetap_count: tetapCount,
            kontrak_count: kontrakCount,
            tetap_percentage: total > 0 ? Math.round((tetapCount / total) * 100) : 0,
            details: distribution
        };
    }
}

export default new DashboardService();
