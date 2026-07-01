import React from 'react';
import { Employee, EmployeeFamilyInfo } from '../../types/hr';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface EmployeeFamilyInfoViewProps {
    employee: Employee;
}

const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
        return format(new Date(dateString), 'd MMMM yyyy', { locale: localeId });
    } catch {
        return dateString;
    }
};

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

export const EmployeeFamilyInfoView: React.FC<EmployeeFamilyInfoViewProps> = ({ employee }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const familyInfo = (employee as any).family_info as EmployeeFamilyInfo || {};
    // Parse JSONB fields if they come as string (from direct DB access without proper Model getter)
    // Though Sequelize usually handles this.
    const anakList = familyInfo.data_anak || [];
    const saudaraList = familyInfo.data_saudara_kandung || [];

    return (
        <div className="space-y-6">
            {/* Pasangan */}
            <div className="bg-white dark:bg-[#161e2e] rounded-xl border border-[#e7ebf3] dark:border-[#2a3447] overflow-hidden shadow-sm">
                <CardHeader title="Pasangan (Istri / Suami)" icon="favorite" />
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <DetailItem label="Nama Pasangan" value={employee.personal_info?.nama_pasangan} />
                    <DetailItem label="Tanggal Lahir" value={formatDate(familyInfo.tanggal_lahir_pasangan)} />
                    <DetailItem label="Pendidikan Terakhir" value={familyInfo.pendidikan_terakhir_pasangan} />
                    <DetailItem label="Pekerjaan" value={employee.personal_info?.pekerjaan_pasangan} />
                    <DetailItem label="Jumlah Anak (KK)" value={employee.personal_info?.jumlah_anak} />
                    <DetailItem label="Keterangan" value={familyInfo.keterangan_pasangan} fullWidth />
                </div>
            </div>

            {/* Data Anak */}
            <div className="bg-white dark:bg-[#161e2e] rounded-xl border border-[#e7ebf3] dark:border-[#2a3447] overflow-hidden shadow-sm">
                <CardHeader title={`Data Anak (${anakList.length})`} icon="family_restroom" />
                <div className="p-6">
                    {anakList.length > 0 ? (
                        <div className="overflow-hidden border border-[#e7ebf3] dark:border-[#2a3447] rounded-xl">
                            <table className="min-w-full divide-y divide-[#e7ebf3] dark:divide-[#2a3447]">
                                <thead className="bg-[#fbfbfc] dark:bg-[#1c2638]">
                                    <tr>
                                        <th className="py-4 pl-6 pr-3 text-left text-[11px] font-extrabold text-[#4c669a] uppercase tracking-widest">No</th>
                                        <th className="py-4 px-3 text-left text-[11px] font-extrabold text-[#4c669a] uppercase tracking-widest">Nama</th>
                                        <th className="py-4 px-3 text-left text-[11px] font-extrabold text-[#4c669a] uppercase tracking-widest">Jenis Kelamin</th>
                                        <th className="py-4 px-3 text-left text-[11px] font-extrabold text-[#4c669a] uppercase tracking-widest">Tanggal Lahir</th>
                                        <th className="py-4 px-6 text-left text-[11px] font-extrabold text-[#4c669a] uppercase tracking-widest">Keterangan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e7ebf3] dark:divide-[#2a3447] bg-white dark:bg-[#161e2e]">
                                    {anakList.map((anak, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-bold text-[#0d121b] dark:text-white">{idx + 1}</td>
                                            <td className="whitespace-nowrap py-4 px-3 text-sm font-semibold text-[#0d121b] dark:text-white">{anak.nama}</td>
                                            <td className="whitespace-nowrap py-4 px-3 text-sm text-[#4c669a] dark:text-gray-400">{anak.jenis_kelamin}</td>
                                            <td className="whitespace-nowrap py-4 px-3 text-sm text-[#4c669a] dark:text-gray-400">{formatDate(anak.tanggal_lahir)}</td>
                                            <td className="whitespace-nowrap py-4 px-6 text-sm text-[#4c669a] dark:text-gray-400">{anak.keterangan || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-[#f6f6f8] dark:bg-[#1c2638] rounded-xl border border-dashed border-[#e7ebf3] dark:border-[#2a3447]">
                            <span className="material-symbols-outlined text-4xl text-[#cfd7e7] mb-2">child_care</span>
                            <p className="text-sm text-[#4c669a] italic">Tidak ada data anak.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Orang Tua & Mertua */}
            <div className="bg-white dark:bg-[#161e2e] rounded-xl border border-[#e7ebf3] dark:border-[#2a3447] overflow-hidden shadow-sm">
                <CardHeader title="Orang Tua & Mertua" icon="supervisor_account" />
                <div className="p-6 space-y-8">
                    <div>
                        <h5 className="text-[10px] font-extrabold text-primary mb-4 uppercase tracking-widest flex items-center gap-2">
                            <span className="size-1.5 rounded-full bg-primary"></span>
                            Orang Tua Kandung
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <DetailItem label="Nama Ayah" value={familyInfo.nama_ayah_kandung} />
                            <DetailItem label="Nama Ibu" value={familyInfo.nama_ibu_kandung} />
                            <DetailItem label="Alamat Orang Tua" value={familyInfo.alamat_orang_tua} fullWidth />
                        </div>
                    </div>

                    <div className="pt-8 border-t border-dashed border-[#e7ebf3] dark:border-[#2a3447]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {/* Ayah Mertua */}
                            <div className="space-y-6">
                                <h5 className="text-[10px] font-extrabold text-[#4c669a] mb-4 uppercase tracking-widest">Ayah Mertua</h5>
                                <div className="grid grid-cols-1 gap-4">
                                    <DetailItem label="Nama" value={familyInfo.nama_ayah_mertua} />
                                    <DetailItem label="Tgl Lahir" value={formatDate(familyInfo.tanggal_lahir_ayah_mertua)} />
                                    <DetailItem label="Pendidikan" value={familyInfo.pendidikan_terakhir_ayah_mertua} />
                                    <DetailItem label="Keterangan" value={familyInfo.keterangan_ayah_mertua} />
                                </div>
                            </div>
                            {/* Ibu Mertua */}
                            <div className="space-y-6 md:border-l md:pl-12 border-[#e7ebf3] dark:border-[#2a3447]">
                                <h5 className="text-[10px] font-extrabold text-[#4c669a] mb-4 uppercase tracking-widest">Ibu Mertua</h5>
                                <div className="grid grid-cols-1 gap-4">
                                    <DetailItem label="Nama" value={familyInfo.nama_ibu_mertua} />
                                    <DetailItem label="Tgl Lahir" value={formatDate(familyInfo.tanggal_lahir_ibu_mertua)} />
                                    <DetailItem label="Pendidikan" value={familyInfo.pendidikan_terakhir_ibu_mertua} />
                                    <DetailItem label="Keterangan" value={familyInfo.keterangan_ibu_mertua} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Saudara Kandung */}
            <div className="bg-white dark:bg-[#161e2e] rounded-xl border border-[#e7ebf3] dark:border-[#2a3447] overflow-hidden shadow-sm">
                <CardHeader title="Saudara Kandung" icon="group" />
                <div className="p-6">
                    <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#f6f6f8] dark:bg-[#1c2638] p-5 rounded-2xl border border-[#e7ebf3] dark:border-[#2a3447]">
                        <DetailItem label="Anak Ke-" value={familyInfo.anak_ke} />
                        <DetailItem label="Jumlah Saudara" value={familyInfo.jumlah_saudara_kandung} />
                    </div>

                    {saudaraList.length > 0 ? (
                        <div className="overflow-hidden border border-[#e7ebf3] dark:border-[#2a3447] rounded-xl">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-[#e7ebf3] dark:divide-[#2a3447]">
                                    <thead className="bg-[#fbfbfc] dark:bg-[#1c2638]">
                                        <tr>
                                            <th className="py-4 pl-6 pr-3 text-left text-[11px] font-extrabold text-[#4c669a] uppercase tracking-widest">No</th>
                                            <th className="py-4 px-3 text-left text-[11px] font-extrabold text-[#4c669a] uppercase tracking-widest">Nama</th>
                                            <th className="py-4 px-3 text-left text-[11px] font-extrabold text-[#4c669a] uppercase tracking-widest">L/P</th>
                                            <th className="py-4 px-3 text-left text-[11px] font-extrabold text-[#4c669a] uppercase tracking-widest">Tanggal Lahir</th>
                                            <th className="py-4 px-3 text-left text-[11px] font-extrabold text-[#4c669a] uppercase tracking-widest">Pendidikan</th>
                                            <th className="py-4 px-3 text-left text-[11px] font-extrabold text-[#4c669a] uppercase tracking-widest">Pekerjaan</th>
                                            <th className="py-4 px-6 text-left text-[11px] font-extrabold text-[#4c669a] uppercase tracking-widest">Keterangan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#e7ebf3] dark:divide-[#2a3447] bg-white dark:bg-[#161e2e]">
                                        {saudaraList.map((saudara, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-bold text-[#0d121b] dark:text-white">{idx + 1}</td>
                                                <td className="whitespace-nowrap py-4 px-3 text-sm font-semibold text-[#0d121b] dark:text-white">{saudara.nama}</td>
                                                <td className="whitespace-nowrap py-4 px-3 text-sm text-[#4c669a] dark:text-gray-400">{saudara.jenis_kelamin === 'Laki-laki' ? 'L' : 'P'}</td>
                                                <td className="whitespace-nowrap py-4 px-3 text-sm text-[#4c669a] dark:text-gray-400">{formatDate(saudara.tanggal_lahir)}</td>
                                                <td className="whitespace-nowrap py-4 px-3 text-sm text-[#4c669a] dark:text-gray-400">{saudara.pendidikan_terakhir || '-'}</td>
                                                <td className="whitespace-nowrap py-4 px-3 text-sm text-[#4c669a] dark:text-gray-400">{saudara.pekerjaan || '-'}</td>
                                                <td className="whitespace-nowrap py-4 px-6 text-sm text-[#4c669a] dark:text-gray-400">{saudara.keterangan || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-[#f6f6f8] dark:bg-[#1c2638] rounded-xl border border-dashed border-[#e7ebf3] dark:border-[#2a3447]">
                            <span className="material-symbols-outlined text-4xl text-[#cfd7e7] mb-2">groups</span>
                            <p className="text-sm text-[#4c669a] italic">Tidak ada data saudara kandung.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
