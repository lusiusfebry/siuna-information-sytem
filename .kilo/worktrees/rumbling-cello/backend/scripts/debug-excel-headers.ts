
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const filePath = 'c:\\project-it\\bis-fix\\template-karyawan .xlsx'; // Note the space in filename from user report

try {
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        // Try without space
        const altPath = 'c:\\project-it\\bis-fix\\template-karyawan.xlsx';
        if (fs.existsSync(altPath)) {
            console.log(`Found file at alternative path: ${altPath}`);
            readHeaders(altPath);
        } else {
            process.exit(1);
        }
    } else {
        readHeaders(filePath);
    }
} catch (error) {
    console.error('Error:', error);
}

function readHeaders(p: string) {
    const workbook = XLSX.readFile(p);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Read first row
    const headers = [];
    let col = 0;
    while (true) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        const cell = sheet[cellAddress];
        if (!cell) break;
        headers.push(cell.v);
        col++;
    }

    console.log('Headers found in Excel:', JSON.stringify(headers, null, 2));

    // Also read first row of data
    const firstRowData = [];
    col = 0;
    while (true) {
        const cellAddress = XLSX.utils.encode_cell({ r: 1, c: col }); // Row 1 (0-indexed is header)
        const cell = sheet[cellAddress];
        // Don't break immediately on empty cell in data, check a few cols
        if (!cell && col > headers.length) break;
        firstRowData.push(cell ? cell.v : null);
        col++;
        if (col >= headers.length) break;
    }
    console.log('First row data:', JSON.stringify(firstRowData, null, 2));
}
