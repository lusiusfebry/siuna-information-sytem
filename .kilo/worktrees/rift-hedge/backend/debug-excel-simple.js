
const ExcelJS = require('exceljs');
const path = require('path');

async function readHeaders() {
    const filePath = path.join('c:\\project-it\\bis-fix', 'template-karyawan .xlsx');
    const workbook = new ExcelJS.Workbook();
    try {
        await workbook.xlsx.readFile(filePath);
        console.log('Workbook loaded.');

        workbook.worksheets.forEach(sheet => {
            console.log(`\n--- Sheet: ${sheet.name} ---`);
            if (sheet.name === 'header excel vs profil karyawan') {
                console.log('Found Mapping Sheet! dumping content...');
                sheet.eachRow((row, rowNumber) => {
                    const excelHeader = row.getCell(2).text;
                    const dbField = row.getCell(4).text;
                    console.log(`Row ${rowNumber}: '${excelHeader}' -> '${dbField}'`);
                });
            }
            const row1 = sheet.getRow(1);
            const headers = [];
            row1.eachCell((cell, colNumber) => {
                headers.push(`[${colNumber}] ${cell.text}`);
            });
            console.log(headers.join('\n'));

            // console.log('\n--- Data Row 212 (Specific Cols) ---');
            // const row212 = sheet.getRow(212);
            console.log('\n--- Checking Correct Columns (7, 8, 9) ---');
            const row212 = sheet.getRow(212);
            [7, 8, 9].forEach(col => {
                const cell = row212.getCell(col);
                console.log(`Row 212 [${col}] (${sheet.getRow(1).getCell(col).text}): '${cell.text}'`);
            });
        });

    } catch (error) {
        console.error('Error reading file:', error);
    }
}

readHeaders();
