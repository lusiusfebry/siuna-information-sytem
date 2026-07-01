import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { employeeService } from '../../services/api/employee.service';
import toast from 'react-hot-toast';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Employee } from '../../types/hr';
import { EmployeeFamilyInfoView } from '../../components/hr/EmployeeFamilyInfoView';
import { EmployeeHRInfoView } from '../../components/hr/EmployeeHRInfoView';
import { EmployeeDocumentsSection } from '../../components/hr/EmployeeDocumentsSection';
import { EmployeeIDCard } from '../../components/hr/EmployeeIDCard';
import { EmployeeQRCode } from '../../components/hr/EmployeeQRCode';


import EntityHistoryTimeline from '../../components/hr/EntityHistoryTimeline';
import EmployeeAssetsTab from '../../components/inventory/EmployeeAssetsTab';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { usePermission } from '../../hooks/usePermission';
import { RESOURCES, ACTIONS } from '../../types/permission';

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            duration: 0.5,
            ease: "easeOut"
        }
    }
};

const EmployeeDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [activeTab, setActiveTab] = useState('personal');
    const [isPhotoZoomed, setIsPhotoZoomed] = useState(false);
    const [showIDCard, setShowIDCard] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const { can } = usePermission();
    const canDelete = can(RESOURCES.EMPLOYEES, ACTIONS.DELETE);

    useEffect(() => {
        const fetchBase = async () => {
            try {
                if (!id) return;
                const data = await employeeService.getEmployeeBase(parseInt(id));
                setEmployee(data as Employee);
            } catch (error) {
                console.error('Failed to fetch employee:', error);
                toast.error('Gagal memuat data karyawan');
            } finally {
                setLoading(false);
            }
        };
        fetchBase();
    }, [id]);

    useEffect(() => {
        const fetchTabData = async () => {
            if (!id || !employee) return;

            try {
                const empId = parseInt(id);
                // Check if data is already loaded to avoid redundant calls
                // If specific fields are missing, fetch them. 
                // Note: 'employee' initially has base info only.

                if (activeTab === 'personal' && !employee.personal_info) {
                    const personalData = await employeeService.getEmployeePersonal(empId);
                    setEmployee((prev: Employee | null) => prev ? { ...prev, personal_info: personalData } : null);
                } else if (activeTab === 'hr' && !employee.hr_info) {
                    const hrData = await employeeService.getEmployeeEmployment(empId);
                    setEmployee((prev: Employee | null) => prev ? { ...prev, hr_info: hrData } : null);
                } else if (activeTab === 'family' && !employee.family_info) {
                    const familyData = await employeeService.getEmployeeFamily(empId);
                    setEmployee((prev: Employee | null) => prev ? { ...prev, family_info: familyData } : null);
                }
                // Documents and history are handled by their own components usually, 
                // but if using Employee object, check structure. 
                // EmployeeDocumentsSection handles its own fetching.
                // EntityHistoryTimeline handles its own fetching.

            } catch (error) {
                console.error(`Failed to fetch ${activeTab} data:`, error);
                toast.error('Gagal memuat detail data');
            }
        };

        if (!loading) {
            fetchTabData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, activeTab, loading]);


    const handleDelete = async () => {
        try {
            if (!id) return;
            setIsDeleting(true);
            console.log(`Attempting to delete employee ID: ${id} from detail page`);
            await employeeService.deleteEmployee(parseInt(id));
            console.log(`Successfully deleted employee ID: ${id}`);
            toast.success('Karyawan berhasil dihapus');
            navigate('/hr/employees');
        } catch (error: unknown) {
            console.error('Failed to delete employee:', error);
            const axiosError = error as { response?: { data?: { message?: string } } };
            toast.error(axiosError.response?.data?.message || 'Gagal menghapus karyawan');
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) return <LoadingSkeleton />;
    if (!employee) return <div>Employee not found</div>;

    const tabs = [
        { id: 'personal', label: 'Data Personal' },
        { id: 'hr', label: 'Informasi HR' },
        { id: 'family', label: 'Data Keluarga' },
        { id: 'payroll', label: 'Payroll' },
        { id: 'attendance', label: 'Cuti & Izin' },
        { id: 'assets', label: 'Aset' },
        { id: 'documents', label: 'Dokumen' },
        { id: 'history', label: 'Riwayat' }
    ];

    return (
        <div className="max-w-6xl mx-auto py-8">
            {/* Header */}
            {/* Header Profil V2 - Tech Luxury */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="premium-card p-6 mb-8 relative overflow-hidden"
            >
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none"></div>

                <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between relative z-10">
                    <div className="flex gap-8 items-center">
                        <div className="relative group">
                            {/* Glowing Ring */}
                            <div className="absolute -inset-1 bg-gradient-to-tr from-primary via-blue-400 to-cyan-300 rounded-[1.4rem] opacity-40 blur-sm group-hover:opacity-75 transition duration-500"></div>

                            <div
                                className={`relative bg-white dark:bg-[#161e2e] rounded-2xl size-28 border border-[#e7ebf3]/50 dark:border-white/10 overflow-hidden shrink-0 shadow-lg p-1.5 backdrop-blur-sm ${employee.foto_karyawan ? 'cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all' : ''}`}
                                onClick={() => employee.foto_karyawan && setIsPhotoZoomed(true)}
                            >
                                {employee.foto_karyawan ? (
                                    <motion.img
                                        layoutId="profile-photo"
                                        src={`http://localhost:3000${employee.foto_karyawan}`}
                                        alt={employee.nama_lengkap}
                                        className="h-full w-full object-cover rounded-xl"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-50/50 dark:bg-slate-800/50 flex items-center justify-center rounded-xl backdrop-blur-sm">
                                        <UserCircleIcon className="h-20 w-20 text-gray-200 dark:text-gray-700" />
                                    </div>
                                )}
                            </div>
                            <div
                                className={`absolute -bottom-1.5 -right-1.5 border-4 border-white dark:border-[#161e2e] size-7 rounded-full shadow-md z-20 ${employee.status_karyawan?.nama === 'Aktif' ? 'bg-green-500' : 'bg-gray-400'}`}
                                title={`Status: ${employee.status_karyawan?.nama || 'Unknown'}`}
                            >
                                <div className="absolute inset-0 rounded-full animate-ping bg-green-500 opacity-20"></div>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-4xl font-extrabold text-[#0d121b] dark:text-white tracking-tighter leading-none mb-2 drop-shadow-sm">
                                {employee.nama_lengkap}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-1">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100/50 dark:bg-white/5 rounded-full border border-gray-200/50 dark:border-white/5 backdrop-blur-sm transition-all hover:border-primary/30">
                                    <span className="material-symbols-outlined text-primary text-lg">id_card</span>
                                    <span className="text-[11px] font-bold text-[#4c669a] dark:text-gray-400 uppercase tracking-widest whitespace-nowrap">NIK: {employee.nomor_induk_karyawan}</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100/50 dark:bg-white/5 rounded-full border border-gray-200/50 dark:border-white/5 backdrop-blur-sm transition-all hover:border-primary/30">
                                    <span className="material-symbols-outlined text-primary text-lg">call</span>
                                    <span className="text-[11px] font-bold text-[#4c669a] dark:text-gray-400 uppercase tracking-widest whitespace-nowrap">{employee.nomor_handphone || '-'}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 mt-4">
                                <span className="px-3 py-1.5 bg-primary/10 text-primary text-[11px] font-extrabold rounded-lg uppercase tracking-[0.15em] border border-primary/20 shadow-sm shadow-primary/5">
                                    {employee.department?.nama || '-'}
                                </span>
                                <span className="px-3 py-1.5 bg-gray-100 dark:bg-white/5 text-[#4c669a] dark:text-gray-400 text-[11px] font-extrabold rounded-lg uppercase tracking-[0.15em] border border-gray-200 dark:border-white/5 shadow-sm">
                                    {employee.lokasi_kerja?.nama || '-'}
                                </span>
                                <span className={`px-3 py-1.5 text-[11px] font-extrabold rounded-lg uppercase tracking-[0.15em] border shadow-sm ${employee.status_karyawan?.nama === 'Aktif'
                                    ? 'bg-green-500/10 text-green-600 border-green-500/20'
                                    : 'bg-gray-100 dark:bg-white/5 text-[#4c669a] dark:text-gray-400 border-gray-200 dark:border-white/5'
                                    }`}>
                                    {employee.status_karyawan?.nama || '-'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 items-center">
                        <EmployeeQRCode
                            nik={employee.nomor_induk_karyawan}
                            employeeName={employee.nama_lengkap}
                        />
                        <div className="flex flex-col gap-2.5">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowIDCard(true)}
                                    className="flex-1 bg-white dark:bg-[#2a3447] text-[#0d121b] dark:text-white border border-[#e7ebf3] dark:border-[#374151] px-3 py-2.5 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 hover:bg-[#f6f6f8] dark:hover:bg-[#374151] transition-all shadow-sm active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-xl">badge</span>
                                    LIHAT ID
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="flex-1 bg-primary text-white px-3 py-2.5 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-sm hover:shadow-md active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-xl">print</span>
                                    CETAK
                                </button>
                            </div>
                            {canDelete && (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="bg-white dark:bg-[#161e2e] text-red-500 border border-red-200 dark:border-red-900/30 px-5 py-2.5 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shadow-sm active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-xl">delete</span>
                                    HAPUS PROFIL
                                </button>
                            )}
                            <button
                                onClick={() => navigate(`/hr/employees/${id}/edit`)}
                                className="bg-white dark:bg-[#2a3447] text-[#0d121b] dark:text-white border border-[#e7ebf3] dark:border-[#374151] px-5 py-2.5 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 hover:bg-[#f6f6f8] dark:hover:bg-[#374151] transition-all shadow-sm active:scale-95"
                            >
                                <span className="material-symbols-outlined text-xl">edit</span>
                                EDIT PROFIL
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Tabs & Content */}
            <div className="mb-10 border-b border-[#e7ebf3] dark:border-white/5 relative">
                <div className="flex gap-4 min-w-max">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className="relative group py-5 px-4 outline-none transition-all"
                        >
                            <span className={`${activeTab === tab.id
                                ? 'text-primary'
                                : 'text-[#4c669a] dark:text-gray-400 hover:text-[#0d121b] dark:hover:text-white'
                                } text-[13px] font-extrabold uppercase tracking-[0.2em] relative z-10 transition-colors duration-300`}>
                                {tab.label}
                            </span>
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeTabProfile"
                                    className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-4px_8px_rgba(19,91,236,0.3)]"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="min-h-[400px]"
                >
                    {activeTab === 'personal' && (
                        <>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Group: Biodata */}
                                <motion.div variants={itemVariants} className="premium-card overflow-hidden">
                                    <CardHeader title="Biodata" icon="person" />
                                    <div className="p-8 grid grid-cols-2 gap-8">
                                        <DetailItem label="Nama Lengkap" value={employee.nama_lengkap} />
                                        <DetailItem label="Jenis Kelamin" value={employee.personal_info?.jenis_kelamin} />
                                        <DetailItem label="Tempat, Tgl Lahir" value={`${employee.personal_info?.tempat_lahir || '-'}, ${employee.personal_info?.tanggal_lahir || '-'}`} />
                                        <DetailItem label="Status Pernikahan" value={employee.personal_info?.status_pernikahan} />
                                    </div>
                                </motion.div>

                                {/* Group: Identifikasi */}
                                <motion.div variants={itemVariants} className="premium-card overflow-hidden">
                                    <CardHeader title="Identifikasi" icon="fingerprint" />
                                    <div className="p-8 grid grid-cols-2 md:grid-cols-3 gap-8">
                                        <DetailItem label="Agama" value={employee.personal_info?.agama} />
                                        <DetailItem label="Gol. Darah" value={employee.personal_info?.golongan_darah} />
                                        <DetailItem label="No. KK" value={employee.personal_info?.nomor_kartu_keluarga} />
                                        <DetailItem label="No. KTP" value={employee.personal_info?.nomor_ktp} />
                                        <DetailItem label="NPWP" value={employee.personal_info?.nomor_npwp} />
                                        <DetailItem label="Status Pajak" value={employee.personal_info?.status_pajak} />
                                        <DetailItem label="BPJS Kesehatan" value={employee.personal_info?.nomor_bpjs} />
                                        <DetailItem label="NIK KK" value={employee.personal_info?.no_nik_kk} />
                                    </div>
                                </motion.div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                                {/* Group: Alamat */}
                                <motion.div variants={itemVariants} className="premium-card overflow-hidden">
                                    <CardHeader title="Alamat" icon="location_on" />
                                    <div className="p-8 space-y-8">
                                        <div>
                                            <h5 className="text-[10px] font-bold text-primary mb-4 uppercase tracking-[0.2em] opacity-80">Alamat Domisili</h5>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <DetailItem label="Jalan / No. Rumah" value={employee.personal_info?.alamat_domisili} fullWidth />
                                                <DetailItem label="Kota / Kabupaten" value={employee.personal_info?.kota_domisili} />
                                                <DetailItem label="Provinsi" value={employee.personal_info?.provinsi_domisili} />
                                                <DetailItem label="Kode Pos" value={employee.personal_info?.kode_pos} />
                                            </div>
                                        </div>
                                        <div className="pt-6 border-t border-dashed border-[#e7ebf3] dark:border-white/5">
                                            <h5 className="text-[10px] font-bold text-primary mb-4 uppercase tracking-[0.2em] opacity-80">Alamat KTP</h5>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <DetailItem label="Jalan / No. Rumah" value={employee.personal_info?.alamat_ktp} fullWidth />
                                                <DetailItem label="Kota / Kabupaten" value={employee.personal_info?.kota_ktp} />
                                                <DetailItem label="Provinsi" value={employee.personal_info?.provinsi_ktp} />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Group: Informasi Kontak */}
                                <motion.div variants={itemVariants} className="premium-card overflow-hidden h-fit">
                                    <CardHeader title="Informasi Kontak" icon="contact_phone" />
                                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <DetailItem label="Email Pribadi" value={employee.personal_info?.email_pribadi} />
                                        <DetailItem label="Handphone 1 (Utama)" value={employee.nomor_handphone} />
                                        <DetailItem label="Handphone 2" value={employee.personal_info?.nomor_handphone_2} />
                                        <DetailItem label="WhatsApp" value={employee.personal_info?.nomor_wa} />
                                        <DetailItem label="Telepon Rumah 1" value={employee.personal_info?.nomor_telepon_rumah_1} />
                                        <DetailItem label="Telepon Rumah 2" value={employee.personal_info?.nomor_telepon_rumah_2} />
                                        <DetailItem label="Media Sosial" value={employee.personal_info?.akun_sosmed} />
                                    </div>
                                </motion.div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                                {/* Group: Informasi Keluarga */}
                                <motion.div variants={itemVariants} className="premium-card overflow-hidden">
                                    <CardHeader title="Informasi Keluarga" icon="family_restroom" />
                                    <div className="p-8 grid grid-cols-2 md:grid-cols-3 gap-8">
                                        <DetailItem label="Nama Pasangan" value={employee.personal_info?.nama_pasangan} fullWidth={true} />
                                        <DetailItem label="Tgl Menikah" value={employee.personal_info?.tanggal_menikah} />
                                        <DetailItem label="Tgl Cerai" value={employee.personal_info?.tanggal_cerai} />
                                        <DetailItem label="Tgl Wafat Pasangan" value={employee.personal_info?.tanggal_wafat_pasangan} />
                                        <DetailItem label="Pekerjaan Pasangan" value={employee.personal_info?.pekerjaan_pasangan} />
                                        <DetailItem label="Jumlah Anak" value={employee.personal_info?.jumlah_anak?.toString()} />
                                    </div>
                                </motion.div>

                                {/* Group: Informasi Perbankan */}
                                <motion.div variants={itemVariants} className="premium-card overflow-hidden h-fit">
                                    <CardHeader title="Informasi Perbankan" icon="account_balance" />
                                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="col-span-1">
                                            <p className="label-text">Nomor Rekening</p>
                                            <p className="value-text text-xl font-bold tracking-tight text-primary">
                                                {employee.personal_info?.nomor_rekening || '-'}
                                            </p>
                                        </div>
                                        <DetailItem label="Nama Pemegang Rekening" value={employee.personal_info?.nama_pemegang_rekening} />
                                        <DetailItem label="Bank" value={employee.personal_info?.nama_bank} />
                                        <DetailItem label="Cabang" value={employee.personal_info?.cabang_bank} />
                                    </div>
                                </motion.div>
                            </div>
                        </>
                    )}

                    {activeTab === 'hr' && (
                        <EmployeeHRInfoView employee={employee} />
                    )}
                    {activeTab === 'family' && (
                        <EmployeeFamilyInfoView employee={employee} />
                    )}
                    {activeTab === 'documents' && (
                        <EmployeeDocumentsSection employeeId={employee.id} />
                    )}
                    {activeTab === 'assets' && (
                        <EmployeeAssetsTab employeeId={employee.id} />
                    )}
                    {activeTab === 'history' && employee.id && (
                        <EntityHistoryTimeline entityType="employees" entityId={employee.id} />
                    )}
                </motion.div>
            </AnimatePresence>

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="Hapus Karyawan"
                message={`Apakah Anda yakin ingin menghapus karyawan ${employee.nama_lengkap}? Tindakan ini tidak dapat dibatalkan.`}
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteConfirm(false)}
                isLoading={isDeleting}
            />

            {/* Print Only View */}
            <div className="hidden print:flex fixed inset-0 z-[9999] bg-white items-center justify-center">
                <div className="qr-print-only scale-125 origin-center">
                    <EmployeeIDCard employee={employee} />
                </div>
            </div>
            {/* Zoom Modal */}
            <AnimatePresence>
                {isPhotoZoomed && employee.foto_karyawan && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsPhotoZoomed(false)}
                        className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
                    >
                        <motion.img
                            layoutId="profile-photo"
                            src={employee.foto_karyawan.startsWith('http') ? employee.foto_karyawan : `http://localhost:3000${employee.foto_karyawan}`}
                            alt={employee.nama_lengkap}
                            className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 30
                            }}
                        />
                    </motion.div>
                )}
                {showIDCard && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowIDCard(false)}
                        className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-transparent"
                        >
                            <EmployeeIDCard employee={employee} />
                            <div className="flex justify-center gap-4 mt-6">
                                <button
                                    onClick={() => window.print()}
                                    className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-gray-100 transition-colors flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined">print</span>
                                    Cetak
                                </button>
                                <button
                                    onClick={() => setShowIDCard(false)}
                                    className="bg-white/20 text-white px-6 py-2 rounded-full font-bold hover:bg-white/30 transition-colors backdrop-blur-md"
                                >
                                    Tutup
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

const CardHeader: React.FC<{ title: string; icon: string }> = ({ title, icon }) => (
    <div className="px-8 py-5 border-b border-[#e7ebf3] dark:border-white/5 flex items-center gap-3 bg-gradient-to-r from-[#fbfbfc] to-transparent dark:from-[#1c2638] dark:to-transparent">
        <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        </div>
        <h4 className="text-base font-bold text-[#0d121b] dark:text-white tracking-tight">{title}</h4>
    </div>
);

const DetailItem: React.FC<{ label: string; value: string | number | undefined | null; fullWidth?: boolean }> = ({ label, value, fullWidth }) => (
    <div className={`${fullWidth ? 'col-span-full' : 'col-span-1'} group/item`}>
        <p className="label-text">{label}</p>
        <p className="value-text transition-colors group-hover/item:text-primary leading-relaxed">
            {value !== undefined && value !== null && value !== '' ? value : '-'}
        </p>
    </div>
);

export default EmployeeDetailPage;
