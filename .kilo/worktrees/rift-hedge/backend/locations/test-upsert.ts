
import sequelize from '../src/config/database';
import excelImportService from '../src/modules/hr/services/excel-import.service';
import employeeService from '../src/modules/hr/services/employee.service';
import Employee from '../src/modules/hr/models/Employee';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

async function testUpsert() {
    try {
        await sequelize.authenticate();
        console.log('Connection established.');

        // 1. Create a dummy employee manually
        const nik = 'TEST-UPSERT-' + Date.now();
        console.log(`Creating initial employee with NIK: ${nik}`);

        await employeeService.createEmployeeComplete(
            {
                nama_lengkap: 'Original Name',
                nomor_induk_karyawan: nik,
                email_perusahaan: `test-${Date.now()}@example.com`,
                status_karyawan_id: 1, // Aktif
                is_draft: false
            } as any,
            {}, {}, {} // Empty personal/hr/family info
        );

        // 2. Create a temporary Excel file with UPDATED data for this NIK
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Sheet1');

        // Headers matching the template
        sheet.addRow([
            'NAMA LENGKAP', 'NOMOR INDUK KARYAWAN', 'EMAIL PERUSAHAAN', 'STATUS KARYAWAN'
        ]);

        // Data row - CHANGING NAME
        sheet.addRow([
            'Updated Name via Import', nik, `updated-${Date.now()}@example.com`, 'Aktif'
        ]);

        const tempFilePath = path.join(__dirname, 'temp-upsert-test.xlsx');
        await workbook.xlsx.writeFile(tempFilePath);
        console.log('Temporary Excel file created.');

        // 3. Run Import
        console.log('Running import...');
        const result = await excelImportService.importEmployees(tempFilePath);
        console.log('Import Result:', result);

        // 4. Verify Update
        const updatedEmployee = await Employee.findOne({ where: { nomor_induk_karyawan: nik } });
        console.log('Updated Employee Name:', updatedEmployee?.nama_lengkap);

        if (updatedEmployee?.nama_lengkap === 'Updated Name via Import') {
            console.log('SUCCESS: Employee was updated!');
        } else {
            console.error('FAILURE: Employee was NOT updated.');
        }

        // Cleanup
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        // await updatedEmployee?.destroy(); // Optional cleanup

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

testUpsert();
