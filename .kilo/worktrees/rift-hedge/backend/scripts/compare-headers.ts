
// @ts-nocheck
const ExcelJS = require('exceljs');
const path = require('path');

const sourceFile = 'c:\\project-it\\bis-fix\\planning\\BMI-kosong.xlsx';
const targetFile = 'c:\\project-it\\bis-fix\\template-karyawan (5).xlsx';

async function compare() {
    const wbSource = new ExcelJS.Workbook();
    await wbSource.xlsx.readFile(sourceFile);
    const sheetSource = wbSource.getWorksheet('Masterdata') || wbSource.worksheets[1]; // Try by name or index (Sheet 2)

    const wbTarget = new ExcelJS.Workbook();
    await wbTarget.xlsx.readFile(targetFile);
    const sheetTarget = wbTarget.getWorksheet('Data Karyawan') || wbTarget.worksheets[0];

    const sourceHeaders = sheetSource.getRow(1).values.slice(1).map(v => v ? v.toString().trim() : '');
    const targetHeaders = sheetTarget.getRow(1).values.slice(1).map(v => v ? v.toString().trim() : '');

    console.log(`Source Headers (${sourceHeaders.length}):`);
    console.log(sourceHeaders.join(', '));
    console.log('\n-----------------------------------\n');
    console.log(`Target Headers (${targetHeaders.length}):`);
    console.log(targetHeaders.join(', '));
    console.log('\n-----------------------------------\n');

    console.log('MISSING IN TARGET (Source has, Target missing):');
    sourceHeaders.forEach(h => {
        if (!targetHeaders.includes(h)) {
            // Check for potential fuzzy matches (typo fixes)
            const fuzzy = targetHeaders.find(th => th.replace('NOMOR', 'NOMIR').replace('RUMAH', 'RUMAJ') === h);
            if (fuzzy) {
                console.log(`[RENAMED] "${h}" -> "${fuzzy}"`);
            } else {
                console.log(`[MISSING] "${h}"`);
            }
        }
    });

    console.log('\nEXTRA IN TARGET (Target has, Source missing):');
    targetHeaders.forEach(h => {
        if (!sourceHeaders.includes(h)) {
            const fuzzy = sourceHeaders.find(sh => h.replace('NOMOR', 'NOMIR').replace('RUMAH', 'RUMAJ') === sh);
            if (!fuzzy) console.log(`[EXTRA] "${h}"`);
        }
    });

    console.log('\nIndex Comparison:');
    const max = Math.max(sourceHeaders.length, targetHeaders.length);
    for (let i = 0; i < max; i++) {
        const s = sourceHeaders[i] || '(empty)';
        const t = targetHeaders[i] || '(empty)';
        if (s !== t) {
            console.log(`Col ${i + 1}: Source="${s}" vs Target="${t}"`);
        }
    }
}

compare();
