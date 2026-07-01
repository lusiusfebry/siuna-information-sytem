
import ExcelJS from 'exceljs';
import path from 'path';

async function readHeaders() {
    // Correct path relative to where script is run (backend root)
    const filePath = path.join('c:\\project-it\\bis-fix', 'template-karyawan .xlsx');
    const workbook = new ExcelJS.Workbook();
    try {
        await workbook.xlsx.readFile(filePath);
        console.log('Workbook loaded.');

        workbook.worksheets.forEach(sheet => {
            console.log(`\n--- Sheet: ${sheet.name} ---`);
            const row1 = sheet.getRow(1);
            const headers: string[] = [];
            row1.eachCell((cell, colNumber) => {
                headers.push(`[${colNumber}] ${cell.text}`);
            });
            console.log(headers.join('\n'));

            // Also print first data row to see values for Pangkat
            const row2 = sheet.getRow(2);
            const values: string[] = [];
            row2.eachCell((cell, colNumber) => {
                values.push(`[${colNumber}] ${cell.text}`);
            });
            console.log('\n--- First Data Row ---');
            console.log(values.join('\n'));
        });

    } catch (error) {
        console.error('Error reading file:', error);
    }
}

readHeaders();
