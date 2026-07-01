import ExcelJS from 'exceljs';
import puppeteer from 'puppeteer';
import { Op, Sequelize } from 'sequelize';
import InvStok from '../models/Stok';
import InvTransaksi from '../models/Transaksi';
import InvTransaksiDetail from '../models/TransaksiDetail';
import InvProduk from '../models/Produk';
import InvGudang from '../models/Gudang';
import InvUom from '../models/Uom';
import InvBrand from '../models/Brand';
import InvSerialNumber from '../models/SerialNumber';
import Employee from '../../hr/models/Employee';
import User from '../../auth/models/User';
import companySettingsService from '../../auth/services/company-settings.service';

class InventoryExportService {
    private async getBranding() {
        const s = await companySettingsService.getSettings();
        return {
            creator: `${s.company_short_name} Inventory`,
            footer: `${s.company_short_name} - ${s.company_name}`,
        };
    }

    async exportStokToExcel(filters: any): Promise<Buffer> {
        const { gudang_id } = filters;
        const where: any = {};
        if (gudang_id) where.gudang_id = gudang_id;

        const stokData = await InvStok.findAll({
            where,
            include: [
                { model: InvProduk, as: 'produk', attributes: ['id', 'code', 'nama'], include: [{ model: InvBrand, as: 'brand', attributes: ['id', 'nama'] }] },
                { model: InvGudang, as: 'gudang', attributes: ['id', 'code', 'nama'] },
                { model: InvUom, as: 'uom', attributes: ['id', 'nama'] },
            ],
            order: [['updated_at', 'DESC']],
        });

        const transaksiWhere: any = {};
        if (filters.tanggal_dari && filters.tanggal_sampai) {
            transaksiWhere.tanggal = { [Op.between]: [filters.tanggal_dari, filters.tanggal_sampai] };
        }

        const transaksiData = await InvTransaksi.findAll({
            where: transaksiWhere,
            include: [
                { model: InvGudang, as: 'gudang', attributes: ['id', 'nama'] },
                { model: InvGudang, as: 'gudang_tujuan', attributes: ['id', 'nama'] },
                { model: Employee, as: 'karyawan', attributes: ['id', 'nama_lengkap'] },
                { model: User, as: 'creator', attributes: ['id', 'nama'] },
                {
                    model: InvTransaksiDetail, as: 'details',
                    include: [
                        { model: InvProduk, as: 'produk', attributes: ['id', 'code', 'nama'] },
                        { model: InvUom, as: 'uom', attributes: ['id', 'nama'] },
                    ],
                },
            ],
            order: [['created_at', 'DESC']],
            limit: 500,
        });

        const branding = await this.getBranding();
        const workbook = new ExcelJS.Workbook();
        workbook.creator = branding.creator;
        workbook.created = new Date();

        const headerStyle: Partial<ExcelJS.Style> = {
            font: { bold: true, color: { argb: 'FFFFFFFF' } },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } },
            alignment: { horizontal: 'center', vertical: 'middle' },
            border: {
                top: { style: 'thin' }, bottom: { style: 'thin' },
                left: { style: 'thin' }, right: { style: 'thin' },
            },
        };

        // Sheet 1: Stok
        const stokSheet = workbook.addWorksheet('Stok Inventaris');
        stokSheet.columns = [
            { header: 'No', key: 'no', width: 6 },
            { header: 'Kode Produk', key: 'kode_produk', width: 15 },
            { header: 'Nama Produk', key: 'nama_produk', width: 30 },
            { header: 'Brand', key: 'brand', width: 20 },
            { header: 'Gudang', key: 'gudang', width: 20 },
            { header: 'Jumlah', key: 'jumlah', width: 12 },
            { header: 'UOM', key: 'uom', width: 12 },
        ];
        stokSheet.getRow(1).eachCell((cell) => { cell.style = headerStyle; });

        stokData.forEach((item: any, idx: number) => {
            stokSheet.addRow({
                no: idx + 1,
                kode_produk: item.produk?.code,
                nama_produk: item.produk?.nama,
                brand: item.produk?.brand?.nama,
                gudang: item.gudang?.nama,
                jumlah: item.jumlah,
                uom: item.uom?.nama,
            });
        });

        // Sheet 2: Transaksi
        const trxSheet = workbook.addWorksheet('Transaksi');
        trxSheet.columns = [
            { header: 'No', key: 'no', width: 6 },
            { header: 'Kode', key: 'code', width: 14 },
            { header: 'Tanggal', key: 'tanggal', width: 14 },
            { header: 'Tipe', key: 'tipe', width: 12 },
            { header: 'Sub Tipe', key: 'sub_tipe', width: 18 },
            { header: 'Gudang', key: 'gudang', width: 20 },
            { header: 'Gudang Tujuan', key: 'gudang_tujuan', width: 20 },
            { header: 'Karyawan', key: 'karyawan', width: 25 },
            { header: 'Supplier', key: 'supplier', width: 25 },
            { header: 'Dibuat Oleh', key: 'creator', width: 20 },
        ];
        trxSheet.getRow(1).eachCell((cell) => { cell.style = headerStyle; });

        transaksiData.forEach((item: any, idx: number) => {
            trxSheet.addRow({
                no: idx + 1,
                code: item.code,
                tanggal: item.tanggal,
                tipe: item.tipe,
                sub_tipe: item.sub_tipe,
                gudang: item.gudang?.nama,
                gudang_tujuan: item.gudang_tujuan?.nama || '-',
                karyawan: item.karyawan?.nama_lengkap || '-',
                supplier: item.supplier_nama || '-',
                creator: item.creator?.nama,
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }

    async exportStokToPDF(filters: any): Promise<Buffer> {
        const branding = await this.getBranding();
        const where: any = {};
        if (filters.gudang_id) where.gudang_id = filters.gudang_id;

        const stokData = await InvStok.findAll({
            where,
            include: [
                { model: InvProduk, as: 'produk', attributes: ['id', 'code', 'nama'] },
                { model: InvGudang, as: 'gudang', attributes: ['id', 'code', 'nama'] },
                { model: InvUom, as: 'uom', attributes: ['id', 'nama'] },
            ],
            order: [['updated_at', 'DESC']],
        });

        const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; }
h1 { font-size: 18px; text-align: center; margin-bottom: 4px; }
.subtitle { text-align: center; color: #666; margin-bottom: 20px; font-size: 12px; }
table { width: 100%; border-collapse: collapse; }
th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
th { background: #4472C4; color: white; font-weight: bold; }
tr:nth-child(even) { background: #f9f9f9; }
.footer { margin-top: 20px; text-align: right; font-size: 10px; color: #999; }
</style></head><body>
<h1>Laporan Stok Inventaris</h1>
<p class="subtitle">Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
<table>
<thead><tr><th>No</th><th>Kode Produk</th><th>Nama Produk</th><th>Gudang</th><th>Jumlah</th><th>UOM</th></tr></thead>
<tbody>
${stokData.map((item: any, idx: number) => `<tr>
<td>${idx + 1}</td><td>${item.produk?.code}</td><td>${item.produk?.nama}</td>
<td>${item.gudang?.nama}</td><td style="text-align:right">${item.jumlah}</td><td>${item.uom?.nama}</td>
</tr>`).join('')}
</tbody></table>
<p class="footer">${branding.footer}</p>
</body></html>`;

        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '15mm', bottom: '15mm', left: '10mm', right: '10mm' } });
        await browser.close();

        return Buffer.from(pdfBuffer);
    }

    private getHeaderStyle(): Partial<ExcelJS.Style> {
        return {
            font: { bold: true, color: { argb: 'FFFFFFFF' } },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } },
            alignment: { horizontal: 'center', vertical: 'middle' },
            border: {
                top: { style: 'thin' }, bottom: { style: 'thin' },
                left: { style: 'thin' }, right: { style: 'thin' },
            },
        };
    }

    private async generatePDF(html: string): Promise<Buffer> {
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '15mm', bottom: '15mm', left: '10mm', right: '10mm' } });
        await browser.close();
        return Buffer.from(pdfBuffer);
    }

    private getPdfBaseStyles(): string {
        return `body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; }
h1 { font-size: 18px; text-align: center; margin-bottom: 4px; }
.subtitle { text-align: center; color: #666; margin-bottom: 20px; font-size: 12px; }
table { width: 100%; border-collapse: collapse; }
th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
th { background: #4472C4; color: white; font-weight: bold; }
tr:nth-child(even) { background: #f9f9f9; }
.footer { margin-top: 20px; text-align: right; font-size: 10px; color: #999; }
.badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; }
.badge-green { background: #dcfce7; color: #166534; }
.badge-blue { background: #dbeafe; color: #1e40af; }
.badge-orange { background: #ffedd5; color: #9a3412; }
.badge-red { background: #fecaca; color: #991b1b; }
.badge-gray { background: #f3f4f6; color: #374151; }
.text-right { text-align: right; }`;
    }

    async exportTransaksiToExcel(filters: any): Promise<Buffer> {
        const where: any = {};
        if (filters.tipe) where.tipe = filters.tipe;
        if (filters.gudang_id) where.gudang_id = filters.gudang_id;
        if (filters.tanggal_dari && filters.tanggal_sampai) {
            where.tanggal = { [Op.between]: [filters.tanggal_dari, filters.tanggal_sampai] };
        }

        const transaksiData = await InvTransaksi.findAll({
            where,
            include: [
                { model: InvGudang, as: 'gudang', attributes: ['id', 'nama'] },
                { model: InvGudang, as: 'gudang_tujuan', attributes: ['id', 'nama'] },
                { model: Employee, as: 'karyawan', attributes: ['id', 'nama_lengkap'] },
                { model: User, as: 'creator', attributes: ['id', 'nama'] },
                {
                    model: InvTransaksiDetail, as: 'details',
                    include: [
                        { model: InvProduk, as: 'produk', attributes: ['id', 'code', 'nama'] },
                        { model: InvUom, as: 'uom', attributes: ['id', 'nama'] },
                    ],
                },
            ],
            order: [['tanggal', 'DESC'], ['created_at', 'DESC']],
        });

        const branding = await this.getBranding();
        const workbook = new ExcelJS.Workbook();
        workbook.creator = branding.creator;
        workbook.created = new Date();

        const sheet = workbook.addWorksheet('Laporan Transaksi');
        sheet.columns = [
            { header: 'No', key: 'no', width: 6 },
            { header: 'Kode Transaksi', key: 'code', width: 16 },
            { header: 'Tanggal', key: 'tanggal', width: 14 },
            { header: 'Tipe', key: 'tipe', width: 14 },
            { header: 'Sub Tipe', key: 'sub_tipe', width: 18 },
            { header: 'Gudang', key: 'gudang', width: 20 },
            { header: 'Gudang Tujuan', key: 'gudang_tujuan', width: 20 },
            { header: 'Karyawan', key: 'karyawan', width: 25 },
            { header: 'Supplier', key: 'supplier', width: 25 },
            { header: 'No Referensi', key: 'no_referensi', width: 18 },
            { header: 'Kode Produk', key: 'produk_code', width: 14 },
            { header: 'Nama Produk', key: 'produk_nama', width: 28 },
            { header: 'Jumlah', key: 'jumlah', width: 10 },
            { header: 'UOM', key: 'uom', width: 10 },
            { header: 'Dibuat Oleh', key: 'creator', width: 20 },
        ];
        sheet.getRow(1).eachCell((cell) => { cell.style = this.getHeaderStyle(); });

        let rowNum = 1;
        transaksiData.forEach((trx: any) => {
            const details = trx.details || [];
            if (details.length === 0) {
                sheet.addRow({
                    no: rowNum++, code: trx.code, tanggal: trx.tanggal, tipe: trx.tipe,
                    sub_tipe: trx.sub_tipe || '-', gudang: trx.gudang?.nama || '-',
                    gudang_tujuan: trx.gudang_tujuan?.nama || '-',
                    karyawan: trx.karyawan?.nama_lengkap || '-', supplier: trx.supplier_nama || '-',
                    no_referensi: trx.no_referensi || '-', produk_code: '-', produk_nama: '-',
                    jumlah: '-', uom: '-', creator: trx.creator?.nama || '-',
                });
            } else {
                details.forEach((det: any) => {
                    sheet.addRow({
                        no: rowNum++, code: trx.code, tanggal: trx.tanggal, tipe: trx.tipe,
                        sub_tipe: trx.sub_tipe || '-', gudang: trx.gudang?.nama || '-',
                        gudang_tujuan: trx.gudang_tujuan?.nama || '-',
                        karyawan: trx.karyawan?.nama_lengkap || '-', supplier: trx.supplier_nama || '-',
                        no_referensi: trx.no_referensi || '-',
                        produk_code: det.produk?.code || '-', produk_nama: det.produk?.nama || '-',
                        jumlah: det.jumlah, uom: det.uom?.nama || '-', creator: trx.creator?.nama || '-',
                    });
                });
            }
        });

        sheet.autoFilter = { from: 'A1', to: `O${rowNum}` };
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }

    async exportTransaksiToPDF(filters: any): Promise<Buffer> {
        const branding = await this.getBranding();
        const where: any = {};
        if (filters.tipe) where.tipe = filters.tipe;
        if (filters.gudang_id) where.gudang_id = filters.gudang_id;
        if (filters.tanggal_dari && filters.tanggal_sampai) {
            where.tanggal = { [Op.between]: [filters.tanggal_dari, filters.tanggal_sampai] };
        }

        const transaksiData = await InvTransaksi.findAll({
            where,
            include: [
                { model: InvGudang, as: 'gudang', attributes: ['id', 'nama'] },
                { model: InvGudang, as: 'gudang_tujuan', attributes: ['id', 'nama'] },
                { model: Employee, as: 'karyawan', attributes: ['id', 'nama_lengkap'] },
                { model: User, as: 'creator', attributes: ['id', 'nama'] },
                {
                    model: InvTransaksiDetail, as: 'details',
                    include: [
                        { model: InvProduk, as: 'produk', attributes: ['id', 'code', 'nama'] },
                        { model: InvUom, as: 'uom', attributes: ['id', 'nama'] },
                    ],
                },
            ],
            order: [['tanggal', 'DESC'], ['created_at', 'DESC']],
        });

        const rows: string[] = [];
        let no = 1;
        transaksiData.forEach((trx: any) => {
            const details = trx.details || [];
            const makeRow = (det: any) => `<tr>
<td>${no++}</td><td>${trx.code}</td><td>${trx.tanggal}</td><td>${trx.tipe}</td>
<td>${trx.gudang?.nama || '-'}</td><td>${det?.produk?.code || '-'}</td>
<td>${det?.produk?.nama || '-'}</td><td class="text-right">${det?.jumlah ?? '-'}</td>
<td>${det?.uom?.nama || '-'}</td></tr>`;
            if (details.length === 0) rows.push(makeRow(null));
            else details.forEach((det: any) => rows.push(makeRow(det)));
        });

        const subtitle = filters.tanggal_dari && filters.tanggal_sampai
            ? `Periode: ${filters.tanggal_dari} s/d ${filters.tanggal_sampai}`
            : `Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`;

        const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${this.getPdfBaseStyles()}</style></head><body>
<h1>Laporan Transaksi Inventaris</h1>
<p class="subtitle">${subtitle}</p>
<table>
<thead><tr><th>No</th><th>Kode</th><th>Tanggal</th><th>Tipe</th><th>Gudang</th><th>Kode Produk</th><th>Nama Produk</th><th>Jumlah</th><th>UOM</th></tr></thead>
<tbody>${rows.join('')}</tbody>
</table>
<p class="footer">${branding.footer}</p>
</body></html>`;

        return this.generatePDF(html);
    }

    async exportSerialNumberToExcel(filters: any): Promise<Buffer> {
        const where: any = {};
        if (filters.gudang_id) where.gudang_id = filters.gudang_id;
        if (filters.status) where.status = filters.status;

        const data = await InvSerialNumber.findAll({
            where,
            include: [
                { model: InvProduk, as: 'produk', attributes: ['id', 'code', 'nama'], include: [{ model: InvBrand, as: 'brand', attributes: ['id', 'nama'] }] },
                { model: InvGudang, as: 'gudang', attributes: ['id', 'code', 'nama'] },
                { model: Employee, as: 'karyawan', attributes: ['id', 'nama_lengkap'] },
            ],
            order: [['created_at', 'DESC']],
        });

        const branding = await this.getBranding();
        const workbook = new ExcelJS.Workbook();
        workbook.creator = branding.creator;
        workbook.created = new Date();

        const sheet = workbook.addWorksheet('Aset & Serial Number');
        sheet.columns = [
            { header: 'No', key: 'no', width: 6 },
            { header: 'Serial Number', key: 'serial_number', width: 25 },
            { header: 'Tag Number', key: 'tag_number', width: 22 },
            { header: 'Kode Produk', key: 'produk_code', width: 14 },
            { header: 'Nama Produk', key: 'produk_nama', width: 28 },
            { header: 'Brand', key: 'brand', width: 18 },
            { header: 'Gudang', key: 'gudang', width: 20 },
            { header: 'Status', key: 'status', width: 14 },
            { header: 'Digunakan Oleh', key: 'karyawan', width: 25 },
            { header: 'Tanggal Masuk', key: 'tanggal_masuk', width: 14 },
        ];
        sheet.getRow(1).eachCell((cell) => { cell.style = this.getHeaderStyle(); });

        data.forEach((item: any, idx: number) => {
            sheet.addRow({
                no: idx + 1,
                serial_number: item.serial_number || '-',
                tag_number: item.tag_number || '-',
                produk_code: item.produk?.code || '-',
                produk_nama: item.produk?.nama || '-',
                brand: item.produk?.brand?.nama || '-',
                gudang: item.gudang?.nama || '-',
                status: item.status,
                karyawan: item.karyawan?.nama_lengkap || '-',
                tanggal_masuk: item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-',
            });
        });

        sheet.autoFilter = { from: 'A1', to: `J${data.length + 1}` };
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }

    async exportSerialNumberToPDF(filters: any): Promise<Buffer> {
        const branding = await this.getBranding();
        const where: any = {};
        if (filters.gudang_id) where.gudang_id = filters.gudang_id;
        if (filters.status) where.status = filters.status;

        const data = await InvSerialNumber.findAll({
            where,
            include: [
                { model: InvProduk, as: 'produk', attributes: ['id', 'code', 'nama'] },
                { model: InvGudang, as: 'gudang', attributes: ['id', 'code', 'nama'] },
                { model: Employee, as: 'karyawan', attributes: ['id', 'nama_lengkap'] },
            ],
            order: [['created_at', 'DESC']],
        });

        const statusBadge = (status: string) => {
            const map: Record<string, string> = { Tersedia: 'badge-green', Digunakan: 'badge-blue', Rusak: 'badge-orange', Disposed: 'badge-red' };
            return `<span class="badge ${map[status] || 'badge-gray'}">${status}</span>`;
        };

        const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${this.getPdfBaseStyles()}</style></head><body>
<h1>Laporan Aset & Serial Number</h1>
<p class="subtitle">Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
<table>
<thead><tr><th>No</th><th>Serial Number</th><th>Tag Number</th><th>Produk</th><th>Gudang</th><th>Status</th><th>Digunakan Oleh</th></tr></thead>
<tbody>
${data.map((item: any, idx: number) => `<tr>
<td>${idx + 1}</td><td>${item.serial_number || '-'}</td><td>${item.tag_number || '-'}</td>
<td>${item.produk?.nama || '-'}</td><td>${item.gudang?.nama || '-'}</td>
<td>${statusBadge(item.status)}</td><td>${item.karyawan?.nama_lengkap || '-'}</td>
</tr>`).join('')}
</tbody></table>
<p class="footer">${branding.footer}</p>
</body></html>`;

        return this.generatePDF(html);
    }

    async exportStokRendahToExcel(filters: any): Promise<Buffer> {
        const where: any = {};
        if (filters.gudang_id) where.gudang_id = filters.gudang_id;

        const data = await InvStok.findAll({
            where: {
                ...where,
                [Op.and]: [
                    Sequelize.where(
                        Sequelize.col('jumlah'),
                        Op.lt,
                        Sequelize.fn('COALESCE', Sequelize.col('produk.stok_minimum'), 5)
                    ),
                ],
            },
            include: [
                { model: InvProduk, as: 'produk', attributes: ['id', 'code', 'nama', 'stok_minimum'], include: [{ model: InvBrand, as: 'brand', attributes: ['id', 'nama'] }] },
                { model: InvGudang, as: 'gudang', attributes: ['id', 'code', 'nama'] },
                { model: InvUom, as: 'uom', attributes: ['id', 'nama'] },
            ],
            order: [['jumlah', 'ASC']],
            subQuery: false,
        });

        const branding = await this.getBranding();
        const workbook = new ExcelJS.Workbook();
        workbook.creator = branding.creator;
        workbook.created = new Date();

        const sheet = workbook.addWorksheet('Stok Rendah');
        sheet.columns = [
            { header: 'No', key: 'no', width: 6 },
            { header: 'Kode Produk', key: 'produk_code', width: 14 },
            { header: 'Nama Produk', key: 'produk_nama', width: 28 },
            { header: 'Brand', key: 'brand', width: 18 },
            { header: 'Gudang', key: 'gudang', width: 20 },
            { header: 'Stok Minimum', key: 'stok_minimum', width: 14 },
            { header: 'Jumlah Saat Ini', key: 'jumlah', width: 16 },
            { header: 'Selisih', key: 'selisih', width: 10 },
            { header: 'UOM', key: 'uom', width: 10 },
        ];
        sheet.getRow(1).eachCell((cell) => { cell.style = this.getHeaderStyle(); });

        data.forEach((item: any, idx: number) => {
            const stokMin = item.produk?.stok_minimum || 5;
            const row = sheet.addRow({
                no: idx + 1,
                produk_code: item.produk?.code || '-',
                produk_nama: item.produk?.nama || '-',
                brand: item.produk?.brand?.nama || '-',
                gudang: item.gudang?.nama || '-',
                stok_minimum: stokMin,
                jumlah: item.jumlah,
                selisih: item.jumlah - stokMin,
                uom: item.uom?.nama || '-',
            });
            if (item.jumlah - stokMin < 0) {
                row.getCell('selisih').font = { color: { argb: 'FFFF0000' }, bold: true };
            }
        });

        sheet.autoFilter = { from: 'A1', to: `I${data.length + 1}` };
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }

    async exportStokRendahToPDF(filters: any): Promise<Buffer> {
        const branding = await this.getBranding();
        const where: any = {};
        if (filters.gudang_id) where.gudang_id = filters.gudang_id;

        const data = await InvStok.findAll({
            where: {
                ...where,
                [Op.and]: [
                    Sequelize.where(
                        Sequelize.col('jumlah'),
                        Op.lt,
                        Sequelize.fn('COALESCE', Sequelize.col('produk.stok_minimum'), 5)
                    ),
                ],
            },
            include: [
                { model: InvProduk, as: 'produk', attributes: ['id', 'code', 'nama', 'stok_minimum'] },
                { model: InvGudang, as: 'gudang', attributes: ['id', 'code', 'nama'] },
                { model: InvUom, as: 'uom', attributes: ['id', 'nama'] },
            ],
            order: [['jumlah', 'ASC']],
            subQuery: false,
        });

        const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${this.getPdfBaseStyles()}
.row-critical { background: #fef2f2 !important; }
</style></head><body>
<h1>Laporan Stok Rendah</h1>
<p class="subtitle">Item di bawah batas minimum stok — Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
<table>
<thead><tr><th>No</th><th>Kode Produk</th><th>Nama Produk</th><th>Gudang</th><th>Stok Min</th><th>Jumlah</th><th>Selisih</th><th>UOM</th></tr></thead>
<tbody>
${data.map((item: any, idx: number) => {
    const stokMin = item.produk?.stok_minimum || 5;
    const selisih = item.jumlah - stokMin;
    return `<tr class="${selisih < 0 ? 'row-critical' : ''}">
<td>${idx + 1}</td><td>${item.produk?.code || '-'}</td><td>${item.produk?.nama || '-'}</td>
<td>${item.gudang?.nama || '-'}</td><td class="text-right">${stokMin}</td>
<td class="text-right">${item.jumlah}</td>
<td class="text-right" style="color:${selisih < 0 ? '#dc2626' : '#16a34a'};font-weight:bold">${selisih}</td>
<td>${item.uom?.nama || '-'}</td></tr>`;
}).join('')}
</tbody></table>
<p class="footer">${branding.footer}</p>
</body></html>`;

        return this.generatePDF(html);
    }

    async exportPergerakanToExcel(filters: any): Promise<Buffer> {
        const days = parseInt(filters.days, 10) || 90;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const activeData = await InvTransaksiDetail.findAll({
            attributes: [
                'produk_id',
                [Sequelize.fn('COUNT', Sequelize.col('InvTransaksiDetail.id')), 'trx_count'],
                [Sequelize.fn('SUM', Sequelize.col('InvTransaksiDetail.jumlah')), 'total_qty'],
            ],
            include: [
                { model: InvTransaksi, as: 'transaksi', attributes: [], where: { tanggal: { [Op.gte]: cutoffDate } } },
                { model: InvProduk, as: 'produk', attributes: ['id', 'code', 'nama'] },
            ],
            group: ['produk_id', 'produk.id'],
            raw: true,
            nest: true,
        });

        const activeProducts = (activeData as any[]).map((item: any) => ({
            produk_code: item.produk?.code,
            produk_nama: item.produk?.nama,
            trx_count: parseInt(item.trx_count, 10),
            total_qty: parseInt(item.total_qty, 10),
            classification: parseInt(item.trx_count, 10) > 10 ? 'Fast Moving' : 'Slow Moving',
        }));

        const activeIds = (activeData as any[]).map((p: any) => p.produk_id);
        const deadWhere: any = { jumlah: { [Op.gt]: 0 } };
        if (activeIds.length > 0) deadWhere.produk_id = { [Op.notIn]: activeIds };

        const deadStock = await InvStok.findAll({
            where: deadWhere,
            include: [{ model: InvProduk, as: 'produk', attributes: ['id', 'code', 'nama'] }],
            attributes: ['produk_id', [Sequelize.fn('SUM', Sequelize.col('jumlah')), 'total_stok']],
            group: ['produk_id', 'produk.id'],
            raw: true,
            nest: true,
        });

        const deadItems = (deadStock as any[]).map((item: any) => ({
            produk_code: item.produk?.code,
            produk_nama: item.produk?.nama,
            trx_count: 0,
            total_qty: 0,
            classification: 'Dead Stock',
        }));

        const allItems = [
            ...activeProducts.filter(p => p.classification === 'Fast Moving').sort((a, b) => b.trx_count - a.trx_count),
            ...activeProducts.filter(p => p.classification === 'Slow Moving').sort((a, b) => b.trx_count - a.trx_count),
            ...deadItems,
        ];

        const branding = await this.getBranding();
        const workbook = new ExcelJS.Workbook();
        workbook.creator = branding.creator;
        workbook.created = new Date();

        const sheet = workbook.addWorksheet('Pergerakan Barang');
        sheet.columns = [
            { header: 'No', key: 'no', width: 6 },
            { header: 'Kode Produk', key: 'produk_code', width: 14 },
            { header: 'Nama Produk', key: 'produk_nama', width: 30 },
            { header: 'Jumlah Transaksi', key: 'trx_count', width: 18 },
            { header: 'Total Qty', key: 'total_qty', width: 12 },
            { header: 'Klasifikasi', key: 'classification', width: 16 },
        ];
        sheet.getRow(1).eachCell((cell) => { cell.style = this.getHeaderStyle(); });

        const classColors: Record<string, string> = { 'Fast Moving': 'FF16A34A', 'Slow Moving': 'FFCA8A04', 'Dead Stock': 'FFDC2626' };
        allItems.forEach((item, idx) => {
            const row = sheet.addRow({
                no: idx + 1,
                produk_code: item.produk_code,
                produk_nama: item.produk_nama,
                trx_count: item.trx_count,
                total_qty: item.total_qty,
                classification: item.classification,
            });
            const color = classColors[item.classification];
            if (color) row.getCell('classification').font = { color: { argb: color }, bold: true };
        });

        sheet.autoFilter = { from: 'A1', to: `F${allItems.length + 1}` };
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }

    async exportPergerakanToPDF(filters: any): Promise<Buffer> {
        const branding = await this.getBranding();
        const days = parseInt(filters.days, 10) || 90;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const activeData = await InvTransaksiDetail.findAll({
            attributes: [
                'produk_id',
                [Sequelize.fn('COUNT', Sequelize.col('InvTransaksiDetail.id')), 'trx_count'],
                [Sequelize.fn('SUM', Sequelize.col('InvTransaksiDetail.jumlah')), 'total_qty'],
            ],
            include: [
                { model: InvTransaksi, as: 'transaksi', attributes: [], where: { tanggal: { [Op.gte]: cutoffDate } } },
                { model: InvProduk, as: 'produk', attributes: ['id', 'code', 'nama'] },
            ],
            group: ['produk_id', 'produk.id'],
            raw: true,
            nest: true,
        });

        const activeProducts = (activeData as any[]).map((item: any) => ({
            produk_code: item.produk?.code,
            produk_nama: item.produk?.nama,
            trx_count: parseInt(item.trx_count, 10),
            total_qty: parseInt(item.total_qty, 10),
            classification: parseInt(item.trx_count, 10) > 10 ? 'Fast Moving' : 'Slow Moving',
        }));

        const activeIds = (activeData as any[]).map((p: any) => p.produk_id);
        const deadWhere: any = { jumlah: { [Op.gt]: 0 } };
        if (activeIds.length > 0) deadWhere.produk_id = { [Op.notIn]: activeIds };

        const deadStock = await InvStok.findAll({
            where: deadWhere,
            include: [{ model: InvProduk, as: 'produk', attributes: ['id', 'code', 'nama'] }],
            attributes: ['produk_id', [Sequelize.fn('SUM', Sequelize.col('jumlah')), 'total_stok']],
            group: ['produk_id', 'produk.id'],
            raw: true,
            nest: true,
        });

        const deadItems = (deadStock as any[]).map((item: any) => ({
            produk_code: item.produk?.code,
            produk_nama: item.produk?.nama,
            trx_count: 0,
            total_qty: 0,
            classification: 'Dead Stock',
        }));

        const allItems = [
            ...activeProducts.filter(p => p.classification === 'Fast Moving').sort((a, b) => b.trx_count - a.trx_count),
            ...activeProducts.filter(p => p.classification === 'Slow Moving').sort((a, b) => b.trx_count - a.trx_count),
            ...deadItems,
        ];

        const classStyle: Record<string, string> = { 'Fast Moving': 'color:#16a34a', 'Slow Moving': 'color:#ca8a04', 'Dead Stock': 'color:#dc2626' };

        const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${this.getPdfBaseStyles()}</style></head><body>
<h1>Laporan Pergerakan Barang</h1>
<p class="subtitle">Periode: ${days} hari terakhir — Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
<table>
<thead><tr><th>No</th><th>Kode Produk</th><th>Nama Produk</th><th>Jml Transaksi</th><th>Total Qty</th><th>Klasifikasi</th></tr></thead>
<tbody>
${allItems.map((item, idx) => `<tr>
<td>${idx + 1}</td><td>${item.produk_code}</td><td>${item.produk_nama}</td>
<td class="text-right">${item.trx_count}</td><td class="text-right">${item.total_qty}</td>
<td style="${classStyle[item.classification]};font-weight:bold">${item.classification}</td>
</tr>`).join('')}
</tbody></table>
<p class="footer">${branding.footer}</p>
</body></html>`;

        return this.generatePDF(html);
    }
}

export default new InventoryExportService();
