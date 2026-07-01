
import sequelize from '../src/config/database';
import excelImportService from '../src/modules/hr/services/excel-import.service';
import employeeService from '../src/modules/hr/services/employee.service';
import Employee from '../src/modules/hr/models/Employee';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

async function testFullImport() {
    try {
        await sequelize.authenticate();
        console.log('Connection established.');

        const nik = 'TEST-FULL-IMPORT-' + Date.now();
        console.log(`Creating Employee with NIK: ${nik}`);

        // Create Excel File
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Sheet1');

        // Headers (using the ones from template)
        const headers = [
            'NAMA LENGKAP', 'NOMOR INDUK KARYAWAN', 'EMAIL PERUSAHAAN', 'STATUS KARYAWAN',
            'MANAGER', 'ATASAN LANGSUNG',
            'NOMOR KARTU KELUARGA', 'NOMOR NIK KK',
            'NAMA KONTAK DARURAT 1', 'HUBUNGAN KONTAK DARURAT 1', 'ALAMAT KONTAK DARURAT 1', 'NOMOR HP1 KONTAK DARURAT 1',
            'UKURAN SEPATU', 'UKURAN BAJU',
            'POINT OF HIRE', 'POINT OF ORIGINAL'
        ];
        sheet.addRow(headers);

        // Data Row
        sheet.addRow([
            'Full Import Test User', nik, `full-${Date.now()}@example.com`, 'Aktif',
            '', '', // Manager/Atasan empty for now as we don't have valid NIKs to link
            '1234567890123456', '9876543210987654', // KK, NIK KK
            'Emergency Contact Name', 'Sibling', 'Emergency Address 123', '08123456789',
            '42', 'L', // Size
            'Jakarta', 'Bandung' // Points
        ]);

        const tempFilePath = path.join(__dirname, 'temp-full-import.xlsx');
        await workbook.xlsx.writeFile(tempFilePath);

        // Run Import
        console.log('Running import...');
        const result = await excelImportService.importEmployees(tempFilePath);
        console.log('Import Result:', result);

        if (result.failed > 0) {
            console.log('Errors:', result.errors);
        }

        // Verify Data in DB
        const createdEmployee = await Employee.findOne({
            where: { nomor_induk_karyawan: nik },
            include: ['personal_info', 'hr_info']
        });

        if (!createdEmployee) {
            console.error('FAILURE: Employee not found in DB');
        } else {
            console.log('Employee Found:', createdEmployee.id);
            console.log('KK:', createdEmployee.personal_info?.nomor_kartu_keluarga);
            console.log('NIK KK:', createdEmployee.personal_info?.no_nik_kk);
            console.log('Emergency Name:', createdEmployee.hr_info?.nama_kontak_darurat_1);
            console.log('Shoe Size:', createdEmployee.hr_info?.ukuran_sepatu_kerja);
            console.log('POH:', createdEmployee.hr_info?.point_of_hire);

            if (
                createdEmployee.personal_info?.nomor_kartu_keluarga === '1234567890123456' &&
                createdEmployee.hr_info?.nama_kontak_darurat_1 === 'Emergency Contact Name' &&
                createdEmployee.hr_info?.ukuran_sepatu_kerja === '42'
            ) {
                console.log('SUCCESS: All new fields populated correctly!');
            } else {
                console.error('FAILURE: Some fields missing or incorrect.');
            }
        }

        // Cleanup
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

testFullImport();
