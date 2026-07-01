
import ExcelJS from 'exceljs';

const outputPath = 'c:\\project-it\\bis-fix\\frontend\\public\\template-karyawan.xlsx';

const workbook = new ExcelJS.Workbook();
const sheet = workbook.addWorksheet('Data Karyawan');

// Define Columns matching "Masterdata" source but with CORRECT SPELLING and NO 'NO' column
sheet.columns = [
    // { header: 'NO', key: 'no', width: 5 }, // Removed per user request
    { header: 'NOMOR INDUK KARYAWAN', key: 'nik', width: 25 }, // Fixed NOMIR
    { header: 'NAMA LENGKAP', key: 'nama', width: 35 },
    { header: 'POSISI JABATAN', key: 'posisi', width: 25 },
    { header: 'LOKASI COSTING', key: 'lokasi_costing', width: 20 },
    { header: 'ACTUAL', key: 'actual', width: 15 },
    { header: 'ASSIGN', key: 'assign', width: 15 },
    { header: 'PANGKAT KATEGORI', key: 'kategori_pangkat', width: 20 },
    { header: 'GOLONGAN', key: 'golongan', width: 15 },
    { header: 'SUB GOLONGAN', key: 'sub_golongan', width: 15 },
    { header: 'TEMPAT LAHIR', key: 'tempat_lahir', width: 20 },
    { header: 'TANGGAL LAHIR', key: 'tgl_lahir', width: 15 },
    { header: 'TANGGAL JOIN GROUP', key: 'tgl_join_group', width: 15 },
    { header: 'TANGGAL MASUK', key: 'tgl_masuk', width: 15 },
    { header: 'JENIS HUBUNGAN KERJA', key: 'hubungan_kerja', width: 20 },
    { header: 'TANGGAL AWAL KONTRAK', key: 'tgl_awal_kontrak', width: 15 },
    { header: 'TANGGAL AKHIR KONTRAK', key: 'tgl_akhir_kontrak', width: 15 },
    { header: 'TANGGAL TETAP', key: 'tgl_tetap', width: 15 },
    { header: 'TANGGAL KELUAR', key: 'tgl_keluar', width: 15 },
    { header: 'JENIS KELAMIN', key: 'gender', width: 15 },
    { header: 'AGAMA', key: 'agama', width: 15 },
    { header: 'ALAMAT DOMISILI', key: 'alamat_domisili', width: 40 },
    { header: 'KOTA DOMISILI', key: 'kota_domisili', width: 20 },
    { header: 'PROPINSI DOMISILI', key: 'propinsi_domisili', width: 20 },
    { header: 'NOMOR TELEPON RUMAH 1', key: 'telp_rumah_1', width: 15 },
    { header: 'NOMOR TELEPON RUMAH 2', key: 'telp_rumah_2', width: 15 }, // Fixed RUMAJ
    { header: 'NOMOR HP 1', key: 'hp_1', width: 15 },
    { header: 'NOMOR HP 2', key: 'hp_2', width: 15 }, // Fixed JP
    { header: 'GOLONGAN DARAH', key: 'goldar', width: 10 }, // Fixed GOLOGAN
    { header: 'NOMOR KTP', key: 'ktp', width: 20 },
    { header: 'ALAMAT KTP', key: 'alamat_ktp', width: 40 },
    { header: 'NOMOR NPWP', key: 'npwp', width: 20 },
    { header: 'NOMOR BPJS-TK', key: 'bpjs_tk', width: 20 },
    { header: 'NOMOR DANA PENSIUN', key: 'dana_pensiun', width: 20 },
    { header: 'NOMOR REKENING', key: 'norek', width: 20 },
    { header: 'NAMA PEMILIK REKENING', key: 'nama_rek', width: 30 },
    { header: 'STATUS PERKAWINAN (PAJAK)', key: 'status_pajak_kawin', width: 20 },
    { header: 'JUMLAH ANAK', key: 'jml_anak', width: 10 },
    { header: 'STATUS PAJAK', key: 'status_pajak', width: 15 },
    { header: 'PENDIDIKAN TERAKHIR', key: 'pendidikan', width: 20 },
    { header: 'JURUSAN PENDIDIKAN', key: 'jurusan', width: 20 },
    { header: 'NAMA SEKOLAH', key: 'sekolah', width: 30 },
    { header: 'KOTA SEKOLAH', key: 'kota_sekolah', width: 20 },
    { header: 'STATUS PENDIDIKAN', key: 'status_pendidikan', width: 15 },
    { header: 'KETERANGAN PENDIDIKAN', key: 'ket_pendidikan', width: 30 },
    { header: 'KODE PENDIDIKAN', key: 'kode_pendidikan', width: 15 },
    { header: 'STATUS PERNIKAHAN', key: 'status_nikah', width: 15 },
    { header: 'TANGGAL MENIKAH', key: 'tgl_nikah', width: 15 },
    { header: 'TANGGAL CERAI', key: 'tgl_cerai', width: 15 },
    { header: 'TANGGAL WAFAT PASANGAN', key: 'tgl_wafat_pasangan', width: 15 },
    { header: 'NAMA PASANGAN NIKAH', key: 'nama_pasangan', width: 30 },
    { header: 'TANGGAL LAHIR PASANGAN', key: 'tgl_lahir_pasangan', width: 15 },
    { header: 'PENDIDIKAN TERAKHIR PASANGAN', key: 'pendidikan_pasangan', width: 20 },
    { header: 'PEKERJAAN PASANGAN', key: 'pekerjaan_pasangan', width: 20 },
    { header: 'KETERANGAN PASANGAN', key: 'ket_pasangan', width: 30 },

    // Anak 1-4
    { header: 'NAMA ANAK 1', key: 'nama_anak_1', width: 20 },
    { header: 'JENIS KELAMIN ANAK 1', key: 'jk_anak_1', width: 15 },
    { header: 'TANGGAL LAHIR ANAK 1', key: 'tgl_lahir_anak_1', width: 15 },
    { header: 'KETERANGAN ANAK 1', key: 'ket_anak_1', width: 20 },
    { header: 'NAMA ANAK 2', key: 'nama_anak_2', width: 20 },
    { header: 'JENIS KELAMIN ANAK 2', key: 'jk_anak_2', width: 15 },
    { header: 'TANGGAL LAHIR ANAK 2', key: 'tgl_lahir_anak_2', width: 15 },
    { header: 'KETERANGAN ANAK 2', key: 'ket_anak_2', width: 20 },
    { header: 'NAMA ANAK 3', key: 'nama_anak_3', width: 20 },
    { header: 'JENIS KELAMIN ANAK 3', key: 'jk_anak_3', width: 15 },
    { header: 'TANGGAL LAHIR ANAK 3', key: 'tgl_lahir_anak_3', width: 15 },
    { header: 'KETERANGAN ANAK 3', key: 'ket_anak_3', width: 20 },
    { header: 'NAMA ANAK 4', key: 'nama_anak_4', width: 20 },
    { header: 'JENIS KELAMIN ANAK 4', key: 'jk_anak_4', width: 15 },
    { header: 'TANGGAL LAHIR ANAK 4', key: 'tgl_lahir_anak_4', width: 15 },
    { header: 'KETERANGAN ANAK 4', key: 'ket_anak_4', width: 20 },

    // Parents
    { header: 'NAMA BAPAK KANDUNG', key: 'nama_bapak', width: 20 },
    { header: 'TANGGAL LAHIR BAPAK KANDUNG', key: 'tgl_lahir_bapak', width: 15 }, // Fixed LAHUR
    { header: 'PENDIDIKAN TERAKHIR BAPAK KANDUNG', key: 'pend_bapak', width: 20 },
    { header: 'PEKERJAAN BAPAK KANDUNG', key: 'pek_bapak', width: 20 },
    { header: 'KETERANGAN BAPAK KANDUNG', key: 'ket_bapak', width: 20 },
    { header: 'NAMA IBU KANDUNG', key: 'nama_ibu', width: 20 },
    { header: 'TANGGAL LAHIR IBU KANDUNG', key: 'tgl_lahir_ibu', width: 15 },
    { header: 'PENDIDIKAN TERAKHIR IBU KANDUNG', key: 'pend_ibu', width: 20 },
    { header: 'PEKERJAAN IBU KANDUNG', key: 'pek_ibu', width: 20 },
    { header: 'KETERANGAN IBU KANDUNG', key: 'ket_ibu', width: 20 },

    // Siblings 1-4
    { header: 'NAMA SAUDARA KANDUNG 1', key: 'nama_saudara_1', width: 20 },
    { header: 'JENIS KELAMIN SAUDARA KANDUNG 1', key: 'jk_saudara_1', width: 15 }, // Fixed KELELAMIN
    { header: 'TANGGAL LAHIR SAUDARA KANDUNG 1', key: 'tgl_lahir_saudara_1', width: 15 }, // Fixed LAHUR
    { header: 'PENDIDIKAN TERAKHIR SAUDARA KANDUNG 1', key: 'pend_saudara_1', width: 20 },
    { header: 'PEKERJAAN SAUDARA KANDUNG 1', key: 'pek_saudara_1', width: 20 },
    { header: 'KETERANGAN SAUDARA KANDUNG 1', key: 'ket_saudara_1', width: 20 },

    { header: 'NAMA SAUDARA KANDUNG 2', key: 'nama_saudara_2', width: 20 },
    { header: 'JENIS KELAMIN SAUDARA KANDUNG 2', key: 'jk_saudara_2', width: 15 },
    { header: 'TANGGAL LAHIR SAUDARA KANDUNG 2', key: 'tgl_lahir_saudara_2', width: 15 },
    { header: 'PENDIDIKAN TERAKHIR SAUDARA KANDUNG 2', key: 'pend_saudara_2', width: 20 },
    { header: 'PEKERJAAN SAUDARA KANDUNG 2', key: 'pek_saudara_2', width: 20 },
    { header: 'KETERANGAN SAUDARA KANDUNG 2', key: 'ket_saudara_2', width: 20 },

    { header: 'NAMA SAUDARA KANDUNG 3', key: 'nama_saudara_3', width: 20 },
    { header: 'JENIS KELAMIN SAUDARA KANDUNG 3', key: 'jk_saudara_3', width: 15 },
    { header: 'TANGGAL LAHIR SAUDARA KANDUNG 3', key: 'tgl_lahir_saudara_3', width: 15 },
    { header: 'PENDIDIKAN TERAKHIR SAUDARA KANDUNG 3', key: 'pend_saudara_3', width: 20 },
    { header: 'PEKERJAAN SAUDARA KANDUNG 3', key: 'pek_saudara_3', width: 20 },
    { header: 'KETERANGAN SAUDARA KANDUNG 3', key: 'ket_saudara_3', width: 20 },

    // Duplicate Saudara 3 Group (matches source file count but CORRECTED names)
    // Note: ExcelJS will allow duplicate headers but user might get confused.
    // However, user insisted on matching the column count behavior so we keep it.
    { header: 'NAMA SAUDARA KANDUNG 3', key: 'nama_saudara_3_dup', width: 20 },
    { header: 'JENIS KELAMIN SAUDARA KANDUNG 3', key: 'jk_saudara_3_dup', width: 15 },
    { header: 'TANGGAL LAHIR SAUDARA KANDUNG 3', key: 'tgl_lahir_saudara_3_dup', width: 15 },
    { header: 'PENDIDIKAN TERAKHIR SAUDARA KANDUNG 3', key: 'pend_saudara_3_dup', width: 20 },
    { header: 'PEKERJAAN SAUDARA KANDUNG 3', key: 'pek_saudara_3_dup', width: 20 },
    { header: 'KETERANGAN SAUDARA KANDUNG 3', key: 'ket_saudara_3_dup', width: 20 },

    { header: 'NAMA SAUDARA KANDUNG 4', key: 'nama_saudara_4', width: 20 },
    { header: 'JENIS KELAMIN SAUDARA KANDUNG 4', key: 'jk_saudara_4', width: 15 },
    { header: 'TANGGAL LAHIR SAUDARA KANDUNG 4', key: 'tgl_lahir_saudara_4', width: 15 },
    { header: 'PENDIDIKAN TERAKHIR SAUDARA KANDUNG 4', key: 'pend_saudara_4', width: 20 },
    { header: 'PEKERJAAN SAUDARA KANDUNG 4', key: 'pek_saudara_4', width: 20 },
    { header: 'KETERANGAN SAUDARA KANDUNG 4', key: 'ket_saudara_4', width: 20 },

    { header: 'SIKLUS PEMBAYARAN', key: 'siklus_bayar', width: 20 },
    { header: 'NAMA BANK', key: 'bank', width: 20 },
    { header: 'CABANG BANK', key: 'cabang_bank', width: 20 },

    // In-Laws
    { header: 'NAMA BAPAK MERTUA', key: 'nama_bapak_mertua', width: 20 },
    { header: 'TANGGAL LAHIR BAPAK MERTUA', key: 'tgl_lahir_bapak_mertua', width: 15 }, // Fixed LAHUR
    { header: 'PENDIDIKAN TERAKHIR BAPAK MERTUA', key: 'pend_bapak_mertua', width: 20 }, // Fixed PENDIDKAN
    { header: 'PEKERJAAN BAPAK MERTUA', key: 'pek_bapak_mertua', width: 20 },
    { header: 'KETERANGAN BAPAK MERTUA', key: 'ket_bapak_mertua', width: 20 },
    { header: 'NAMA IBU MERTUA', key: 'nama_ibu_mertua', width: 20 },
    { header: 'TANGGAL LAHIR IBU MERTUA', key: 'tgl_lahir_ibu_mertua', width: 15 },
    { header: 'PENDIDIKAN TERAKHIR IBU MERTUA', key: 'pend_ibu_mertua', width: 20 },
    { header: 'PEKERJAAN IBU MERTUA', key: 'pek_ibu_mertua', width: 20 },
    { header: 'KETERANGAN IBU MERTUA', key: 'ket_ibu_mertua', width: 20 },

    { header: 'ORGANISASI SUB DEPARTMENT', key: 'sub_dept', width: 20 }, // Fixed ORGANISSASI
    { header: 'DEPARTMENT', key: 'department', width: 20 },
    { header: 'DIVISI', key: 'divisi', width: 20 },

    // Emergency Contact
    { header: 'NAMA KONTAK DARURAT 1', key: 'nama_darurat_1', width: 20 },
    { header: 'HUBUNGAN KONTAK DARURAT 1', key: 'hub_darurat_1', width: 20 }, // Fixed HUNGAN KONTRAK
    { header: 'ALAMAT KONTAK DARURAT 1', key: 'alamat_darurat_1', width: 30 },
    { header: 'NOMOR HP1 KONTAK DARURAT 1', key: 'hp1_darurat_1', width: 15 },
    { header: 'NOMOR HP2 KONTAK DARURAT 1', key: 'hp2_darurat_1', width: 15 },

    { header: 'UKURAN SEPATU', key: 'sepatu', width: 10 },
    { header: 'UKURAN BAJU', key: 'baju', width: 10 },
    { header: 'LOKASI SEBELUMNYA', key: 'lokasi_sebelum', width: 20 },
    { header: 'TANGGAL MUTASI', key: 'tgl_mutasi', width: 15 },
    { header: 'UNIT YANG DI BAWAH', key: 'unit_bawah', width: 20 },
    { header: 'POINT OF ORIGINAL', key: 'poo', width: 15 },
    { header: 'POINT OF HIRE', key: 'poh', width: 15 },
    { header: 'NOMOR KARTU KELUARGA', key: 'kk', width: 20 },
    { header: 'NOMOR NIK KK', key: 'nik_kk', width: 20 },
    { header: 'LOKASI KERJA', key: 'lokasi_kerja', width: 20 },
    { header: 'STATUS KARYAWAN', key: 'status_karyawan', width: 20 },
    { header: 'TAG', key: 'tag', width: 20 },
    { header: 'MANAGER', key: 'manager', width: 30 },
    { header: 'ATASAN LANGSUNG', key: 'atasan', width: 30 },
    { header: 'EMAIL PERUSAHAAN', key: 'email_kantor', width: 30 },
    { header: 'EMAIL PRIBADI', key: 'email_pribadi', width: 30 },
];

// Styling Header
const headerRow = sheet.getRow(1);
headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2F75B5' }
};
headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
// headerRow.commit(); // commit() not strictly needed with simple rows

// Data Validation: Gender
sheet.getColumn('gender').eachCell((cell, row) => {
    if (Number(row) > 1) cell.dataValidation = { type: 'list', allowBlank: true, formulae: ['"L,P"'] };
});
// Data Validation: Religion (Example)
sheet.getColumn('agama').eachCell((cell, row) => {
    if (Number(row) > 1) cell.dataValidation = { type: 'list', allowBlank: true, formulae: ['"Islam,Kristen,Katolik,Hindu,Budha,Konghucu,Lainnya"'] };
});

// Helper Comments
sheet.getCell('B1').note = 'Mandatory. Unique Employee ID.';
sheet.getCell('C1').note = 'Mandatory. Full Name.';
sheet.getCell('L1').note = 'YYYY-MM-DD';

console.log(`Generating detailed template at: ${outputPath}`);
workbook.xlsx.writeFile(outputPath)
    .then(() => console.log('Template created successfully!'))
    .catch((err) => console.error('Error:', err));
