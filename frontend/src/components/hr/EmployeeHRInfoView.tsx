import { Employee, EmployeeHRInfo } from '../../types/hr';

const CardHeader: React.FC<{ title: string; icon: string }> = ({ title, icon }) => (
    <div className="px-6 py-4 border-b border-[#e7ebf3] dark:border-[#2a3447] flex items-center gap-2 bg-[#fbfbfc] dark:bg-[#1c2638]">
        <span className="material-symbols-outlined text-primary text-xl">{icon}</span>
        <h4 className="text-base font-bold text-[#0d121b] dark:text-white">{title}</h4>
    </div>
);

const DetailItem: React.FC<{ label: string; value: string | number | undefined | null; fullWidth?: boolean }> = ({ label, value, fullWidth }) => (
    <div className={`${fullWidth ? 'col-span-full' : 'col-span-1'}`}>
        <p className="text-[10px] font-bold text-[#4c669a] dark:text-gray-400 uppercase tracking-widest mb-1.5">{label}</p>
        <p className="text-sm font-semibold text-[#0d121b] dark:text-white leading-relaxed">{value !== undefined && value !== null && value !== '' ? value : '-'}</p>
    </div>
);

// Helper to format date
const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    // Handle YYYY-MM-DD
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

interface EmployeeHRInfoViewProps {
    employee: Employee;
}

export const EmployeeHRInfoView: React.FC<EmployeeHRInfoViewProps> = ({ employee }) => {
    const hrInfo: Partial<EmployeeHRInfo> = employee.hr_info || {};

    return (
        <div className="space-y-6">
            {/* Section 1: Kepegawaian */}
            <div className="bg-white dark:bg-[#161e2e] rounded-xl border border-[#e7ebf3] dark:border-[#2a3447] overflow-hidden shadow-sm">
                <CardHeader title="Kepegawaian" icon="work" />
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <DetailItem label="NIK" value={employee.nomor_induk_karyawan} />
                    <DetailItem label="Email Perusahaan" value={employee.email_perusahaan} />
                    <DetailItem label="Divisi" value={employee.divisi?.nama} />
                    <DetailItem label="Departemen" value={employee.department?.nama} />
                    <DetailItem label="Posisi" value={employee.posisi_jabatan?.nama} />
                    <DetailItem label="Status Karyawan" value={employee.status_karyawan?.nama} />
                    <DetailItem label="Manager" value={employee.manager?.nama_lengkap} />
                    <DetailItem label="Atasan Langsung" value={employee.atasan_langsung?.nama_lengkap} />
                </div>
            </div>

            {/* Section 2: Kontrak */}
            <div className="bg-white dark:bg-[#161e2e] rounded-xl border border-[#e7ebf3] dark:border-[#2a3447] overflow-hidden shadow-sm">
                <CardHeader title="Kontrak & Tanggal" icon="description" />
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <DetailItem label="Jenis Hubungan Kerja" value={hrInfo.jenis_hubungan_kerja?.nama} />
                    <DetailItem label="Tgl Masuk Group" value={formatDate(hrInfo.tanggal_masuk_group)} />
                    <DetailItem label="Tgl Masuk" value={formatDate(hrInfo.tanggal_masuk)} />
                    <DetailItem label="Tgl Permanent" value={formatDate(hrInfo.tanggal_permanent)} />
                    <DetailItem label="Tgl Kontrak" value={formatDate(hrInfo.tanggal_kontrak)} />
                    <DetailItem label="Tgl Akhir Kontrak" value={formatDate(hrInfo.tanggal_akhir_kontrak)} />
                    <DetailItem label="Tgl Berhenti" value={formatDate(hrInfo.tanggal_berhenti)} />
                </div>
            </div>

            {/* Section 3: Education */}
            <div className="bg-white dark:bg-[#161e2e] rounded-xl border border-[#e7ebf3] dark:border-[#2a3447] overflow-hidden shadow-sm">
                <CardHeader title="Pendidikan" icon="school" />
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <DetailItem label="Tingkat Pendidikan" value={hrInfo.tingkat_pendidikan} />
                    <DetailItem label="Bidang Studi" value={hrInfo.bidang_studi} />
                    <DetailItem label="Nama Sekolah" value={hrInfo.nama_sekolah} />
                    <DetailItem label="Kota Sekolah" value={hrInfo.kota_sekolah} />
                    <DetailItem label="Status Kelulusan" value={hrInfo.status_kelulusan} />
                    <DetailItem label="Keterangan Pendidikan" value={hrInfo.keterangan_pendidikan} fullWidth />
                </div>
            </div>

            {/* Section 4: Pangkat */}
            <div className="bg-white dark:bg-[#161e2e] rounded-xl border border-[#e7ebf3] dark:border-[#2a3447] overflow-hidden shadow-sm">
                <CardHeader title="Pangkat & Golongan" icon="stars" />
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <DetailItem label="Kategori Pangkat" value={hrInfo.kategori_pangkat?.nama} />
                    <DetailItem label="Golongan" value={hrInfo.golongan_pangkat?.nama} />
                    <DetailItem label="Sub Golongan" value={hrInfo.sub_golongan_pangkat?.nama} />
                    <DetailItem label="No. Dana Pensiun" value={hrInfo.no_dana_pensiun} />
                </div>
            </div>

            {/* Section 5: Kontak Darurat */}
            <div className="bg-white dark:bg-[#161e2e] rounded-xl border border-[#e7ebf3] dark:border-[#2a3447] overflow-hidden shadow-sm">
                <CardHeader title="Kontak Darurat" icon="contact_emergency" />
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* KD 1 */}
                    <div className="bg-[#f6f6f8] dark:bg-[#1c2638] p-5 rounded-2xl border border-[#e7ebf3] dark:border-[#2a3447]">
                        <h5 className="text-[10px] font-extrabold text-[#4c669a] dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="size-1.5 rounded-full bg-primary"></span>
                            Kontak Utama
                        </h5>
                        <div className="space-y-4">
                            <DetailItem label="Nama" value={hrInfo.nama_kontak_darurat_1} />
                            <DetailItem label="Telepon" value={hrInfo.nomor_telepon_kontak_darurat_1} />
                            <DetailItem label="Hubungan" value={hrInfo.hubungan_kontak_darurat_1} />
                            <DetailItem label="Alamat" value={hrInfo.alamat_kontak_darurat_1} />
                        </div>
                    </div>
                    {/* KD 2 */}
                    <div className="bg-[#f6f6f8] dark:bg-[#1c2638] p-5 rounded-2xl border border-[#e7ebf3] dark:border-[#2a3447]">
                        <h5 className="text-[10px] font-extrabold text-[#4c669a] dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="size-1.5 rounded-full bg-gray-400"></span>
                            Kontak Cadangan
                        </h5>
                        <div className="space-y-4">
                            <DetailItem label="Nama" value={hrInfo.nama_kontak_darurat_2} />
                            <DetailItem label="Telepon" value={hrInfo.nomor_telepon_kontak_darurat_2} />
                            <DetailItem label="Hubungan" value={hrInfo.hubungan_kontak_darurat_2} />
                            <DetailItem label="Alamat" value={hrInfo.alamat_kontak_darurat_2} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 6: POO/POH */}
            <div className="bg-white dark:bg-[#161e2e] rounded-xl border border-[#e7ebf3] dark:border-[#2a3447] overflow-hidden shadow-sm">
                <CardHeader title="Point Of Origin / Hire" icon="distance" />
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <DetailItem label="Point of Origin" value={hrInfo.point_of_original} />
                    <DetailItem label="Point of Hire" value={hrInfo.point_of_hire} />
                </div>
            </div>

            {/* Section 7: Seragam */}
            <div className="bg-white dark:bg-[#161e2e] rounded-xl border border-[#e7ebf3] dark:border-[#2a3447] overflow-hidden shadow-sm">
                <CardHeader title="Seragam & Sepatu" icon="checkroom" />
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <DetailItem label="Ukuran Seragam" value={hrInfo.ukuran_seragam_kerja} />
                    <DetailItem label="Ukuran Sepatu" value={hrInfo.ukuran_sepatu_kerja} />
                </div>
            </div>

            {/* Section 8: Pergerakan */}
            <div className="bg-white dark:bg-[#161e2e] rounded-xl border border-[#e7ebf3] dark:border-[#2a3447] overflow-hidden shadow-sm">
                <CardHeader title="Pergerakan Karyawan" icon="swap_horiz" />
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <DetailItem label="Lokasi Sebelumnya" value={hrInfo.lokasi_sebelumnya?.nama} />
                    <DetailItem label="Tgl Mutasi" value={formatDate(hrInfo.tanggal_mutasi)} />
                </div>
            </div>

            {/* Section 9: Costing */}
            <div className="bg-white dark:bg-[#161e2e] rounded-xl border border-[#e7ebf3] dark:border-[#2a3447] overflow-hidden shadow-sm">
                <CardHeader title="Costing" icon="payments" />
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <DetailItem label="Siklus Gaji" value={hrInfo.siklus_pembayaran_gaji} />
                    <DetailItem label="Costing" value={hrInfo.costing} />
                    <DetailItem label="Assign" value={hrInfo.assign} />
                    <DetailItem label="Actual" value={hrInfo.actual} />
                </div>
            </div>
        </div>
    );
};
