/**
 * Generates the Employee (Karyawan) import template Excel file from the
 * canonical header list in `../src/modules/hr/constants/employee-template.ts`.
 *
 * Output: frontend/public/template-karyawan.xlsx (single sheet "Data Karyawan").
 *
 * Run with:  npx ts-node scripts/generate-employee-template.ts
 */
import path from 'path';
import ExcelJS from 'exceljs';
import { EMPLOYEE_TEMPLATE_HEADERS, EMPLOYEE_TEMPLATE_SHEET } from '../src/modules/hr/constants/employee-template';

async function main() {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Bebang Sistem Informasi';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(EMPLOYEE_TEMPLATE_SHEET);

    // Header row
    sheet.addRow(EMPLOYEE_TEMPLATE_HEADERS);
    const header = sheet.getRow(1);
    header.font = { bold: true };
    header.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    header.height = 30;

    // Reasonable default column widths
    sheet.columns = EMPLOYEE_TEMPLATE_HEADERS.map((h) => ({ width: Math.min(Math.max(h.length + 4, 14), 40) }));

    // Freeze the header row so it stays visible while scrolling
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    const outPath = path.resolve(__dirname, '../../frontend/public/template-karyawan.xlsx');
    await workbook.xlsx.writeFile(outPath);
    console.log(`✅ Template written: ${outPath}`);
    console.log(`   Sheet: "${EMPLOYEE_TEMPLATE_SHEET}", columns: ${EMPLOYEE_TEMPLATE_HEADERS.length}`);
}

main().catch((err) => {
    console.error('Failed to generate template:', err);
    process.exit(1);
});
