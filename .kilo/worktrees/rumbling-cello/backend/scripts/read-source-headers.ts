// @ts-nocheck
const path = require('path');
const ExcelJS = require('exceljs');

const sourcePath = 'c:\\project-it\\bis-fix\\planning\\BMI-kosong.xlsx';

async function readHeaders() {
    const workbook = new ExcelJS.Workbook();
    try {
        await workbook.xlsx.readFile(sourcePath);
        console.log('Workbook loaded:', sourcePath);

        workbook.eachSheet((sheet, id) => {
            console.log(`\nSheet ${id}: "${sheet.name}"`);


            // Try Row 1
            const row1 = sheet.getRow(1).values;
            if (Array.isArray(row1) && row1.length > 0) {
                const headers = row1.slice(1);
                console.log(`  Row 1 Headers Object Count: ${headers.length}`);
                headers.forEach((h, i) => console.log(`    [${i + 1}] ${h}`));
            }


            // Try Row 2 (sometimes headers are here)
            const row2 = sheet.getRow(2).values;
            if (Array.isArray(row2) && row2.length > 0) {
                console.log('  Row 2 Headers:', row2.slice(1).join(', '));
            }
        });

    } catch (error) {
        console.error('Error reading file:', error);
    }
}

readHeaders();
