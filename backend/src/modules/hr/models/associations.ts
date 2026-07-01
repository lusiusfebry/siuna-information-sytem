import Divisi from './Divisi';
import Department from './Department';
import PosisiJabatan from './PosisiJabatan';
import KategoriPangkat from './KategoriPangkat';
import Golongan from './Golongan';
import SubGolongan from './SubGolongan';
import JenisHubunganKerja from './JenisHubunganKerja';
import Tag from './Tag';
import LokasiKerja from './LokasiKerja';
import StatusKaryawan from './StatusKaryawan';
import Employee from './Employee';
import EmployeePersonalInfo from './EmployeePersonalInfo';
import EmployeeHRInfo from './EmployeeHRInfo';
import EmployeeFamilyInfo from './EmployeeFamilyInfo';
import AuditLog from './AuditLog';
import User from '../../auth/models/User';
import { Role } from '../../auth/models/Role';
import { Permission } from '../../auth/models/Permission';

// User & Employee
User.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });
Employee.hasOne(User, { foreignKey: 'employee_id', as: 'user' });

// User & Role
User.belongsTo(Role, { foreignKey: 'role_id', as: 'roleDetails' });
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

// Role & Permission
Role.belongsToMany(Permission, {
    through: 'role_permissions',
    foreignKey: 'role_id',
    otherKey: 'permission_id',
    as: 'permissions'
});
Permission.belongsToMany(Role, {
    through: 'role_permissions',
    foreignKey: 'permission_id',
    otherKey: 'role_id',
    as: 'roles'
});


// Audit Log Relations
User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'audit_logs' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'executor' }); // Renamed back to 'executor' or keep 'user' if unique. The error said 'user' was used twice.


// Master Data Relationships
Department.belongsTo(Divisi, { foreignKey: 'divisi_id', as: 'divisi' });
Divisi.hasMany(Department, { foreignKey: 'divisi_id', as: 'departments' });

PosisiJabatan.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });
Department.hasMany(PosisiJabatan, { foreignKey: 'department_id', as: 'posisi_jabatan' });
Department.belongsTo(Employee, { foreignKey: 'manager_id', as: 'manager' });

// Employee Relationships
// Master Data -> Employee
Divisi.hasMany(Employee, { foreignKey: 'divisi_id', as: 'employees' });
Department.hasMany(Employee, { foreignKey: 'department_id', as: 'employees' });
StatusKaryawan.hasMany(Employee, { foreignKey: 'status_karyawan_id', as: 'employees' });
LokasiKerja.hasMany(Employee, { foreignKey: 'lokasi_kerja_id', as: 'employees' });
Tag.hasMany(Employee, { foreignKey: 'tag_id', as: 'employees' });
PosisiJabatan.hasMany(Employee, { foreignKey: 'posisi_jabatan_id', as: 'employees' });

// Employee -> Master Data
Employee.belongsTo(Divisi, { foreignKey: 'divisi_id', as: 'divisi' });
Employee.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });
Employee.belongsTo(PosisiJabatan, { foreignKey: 'posisi_jabatan_id', as: 'posisi_jabatan' });
Employee.belongsTo(StatusKaryawan, { foreignKey: 'status_karyawan_id', as: 'status_karyawan' });
Employee.belongsTo(LokasiKerja, { foreignKey: 'lokasi_kerja_id', as: 'lokasi_kerja' });
Employee.belongsTo(Tag, { foreignKey: 'tag_id', as: 'tag' });

// Self References
Employee.belongsTo(Employee, { foreignKey: 'manager_id', as: 'manager' });
Employee.belongsTo(Employee, { foreignKey: 'atasan_langsung_id', as: 'atasan_langsung' });
Employee.hasMany(Employee, { foreignKey: 'manager_id', as: 'managed_employees' });
Employee.hasMany(Employee, { foreignKey: 'atasan_langsung_id', as: 'directed_employees' });

// Detailed Info
Employee.hasOne(EmployeePersonalInfo, { foreignKey: 'employee_id', as: 'personal_info' });
Employee.hasOne(EmployeeHRInfo, { foreignKey: 'employee_id', as: 'hr_info' });
Employee.hasOne(EmployeeFamilyInfo, { foreignKey: 'employee_id', as: 'family_info' });

EmployeePersonalInfo.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });
EmployeeFamilyInfo.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

// EmployeeHRInfo Relations
EmployeeHRInfo.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });
EmployeeHRInfo.belongsTo(JenisHubunganKerja, { foreignKey: 'jenis_hubungan_kerja_id', as: 'jenis_hubungan_kerja' });
EmployeeHRInfo.belongsTo(KategoriPangkat, { foreignKey: 'kategori_pangkat_id', as: 'kategori_pangkat' });
EmployeeHRInfo.belongsTo(Golongan, { foreignKey: 'golongan_pangkat_id', as: 'golongan_pangkat' });
EmployeeHRInfo.belongsTo(SubGolongan, { foreignKey: 'sub_golongan_pangkat_id', as: 'sub_golongan_pangkat' });
EmployeeHRInfo.belongsTo(LokasiKerja, { foreignKey: 'lokasi_sebelumnya_id', as: 'lokasi_sebelumnya' });

// Reverse Relations for HR Info (Optional but good for integrity checks)
JenisHubunganKerja.hasMany(EmployeeHRInfo, { foreignKey: 'jenis_hubungan_kerja_id', as: 'employee_hr_infos' });
KategoriPangkat.hasMany(EmployeeHRInfo, { foreignKey: 'kategori_pangkat_id', as: 'employee_hr_infos' });
Golongan.hasMany(EmployeeHRInfo, { foreignKey: 'golongan_pangkat_id', as: 'employee_hr_infos' });

// Employee Documents
import EmployeeDocument from './EmployeeDocument';
Employee.hasMany(EmployeeDocument, { foreignKey: 'employee_id', as: 'documents' });
EmployeeDocument.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

