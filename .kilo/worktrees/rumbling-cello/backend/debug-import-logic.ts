const ExcelJS = require('exceljs');
const path = require('path');
// Mock Sequelize and Models if possible, or just skip if we can't load them easily without TS
// We can use the check-master-data.ts approach but that was TS too.
// Let's try to verify the Excel reading part first.
// Actual DB loading might be hard in JS without proper transpilation of the models.
// So let's mock the cache loading for now, assuming 'Staff' -> 6 based on previous output.

async function debugImportLogic() {
    try {
        console.log('Starting debug logic (Mocking DB)...');

        // Mock Master Data Cache
        const masterCache = {
            KategoriPangkat: new Map()
        };
        // From Step 10473: ID: 6, Nama: 'Staff'
        masterCache.KategoriPangkat.set('staff', 6);
        console.log(`Cache: 'staff' -> 6`);

        const filePath = path.join('c:\\project-it\\bis-fix', 'template-karyawan .xlsx');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.worksheets[0]; // Data Karyawan
        console.log(`Loaded sheet: ${worksheet.name}`);

        // Read Headers like in excel-import.service.ts
        const headers = [];
        worksheet.getRow(1).eachCell((cell, colNumber) => {
            headers[colNumber] = cell.text ? cell.text.trim() : '';
        });
        console.log(`Headers count: ${headers.length}`);
        console.log(`Header [7]: '${headers[7]}'`);

        // Read Row 212
        const row = worksheet.getRow(212);
        const rowData = {};
        row.eachCell((cell, colNumber) => {
            const header = headers[colNumber];
            if (header) {
                if (cell.type !== ExcelJS.ValueType.Date) rowData[header] = cell.value?.toString().trim();
            }
        });

        console.log('Row 212 Data (PANGKAT KATEGORI):', rowData['PANGKAT KATEGORI']);

        // Define Mapping (Fallback)
        const mapping = {
            employeeProfile: {
                'PANGKAT KATEGORI': 'kategori_pangkat_id'
            }
        };

        // Simulate getValue
        const dbField = 'kategori_pangkat_id';
        const excelKey = 'PANGKAT KATEGORI';

        const excelHeader = Object.keys(mapping.employeeProfile).find(key => mapping.employeeProfile[key] === dbField);
        console.log(`Found excelHeader key for ${dbField}: '${excelHeader}'`);

        const val = excelHeader ? rowData[excelHeader] : (excelKey ? rowData[excelKey] : undefined);
        console.log(`Value from rowData: '${val}'`);

        // Simulate checkLookup
        if (val) {
            const normalized = val.toLowerCase().trim();
            console.log(`Normalized value: '${normalized}'`);
            if (masterCache.KategoriPangkat.has(normalized)) {
                console.log(`Match found! ID: ${masterCache.KategoriPangkat.get(normalized)}`);
            } else {
                console.log('NO MATCH in Master Data Cache!');
                console.log('Available keys:', [...masterCache.KategoriPangkat.keys()]);
            }
        } else {
            console.log('Value is Empty/Null.');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

debugImportLogic();
