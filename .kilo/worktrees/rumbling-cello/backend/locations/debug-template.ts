/// <reference types="node" />
import ExcelJS from 'exceljs';
import path from 'path';

async function readHeaders() {
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
        });

    } catch (error) {
        console.error('Error reading file:', error);
    }
}

readHeaders();
