import ExcelJS from 'exceljs';
import puppeteer from 'puppeteer';
import { Op } from 'sequelize';
import InvStok from '../models/Stok';
import InvTransaksi from '../models/Transaksi';
import InvTransaksiDetail from '../models/TransaksiDetail';
import InvProduk from '../models/Produk';
import InvGudang from '../models/Gudang';
import InvUom from '../models/Uom';
import InvBrand from '../models/Brand';
import Employee from '../../hr/models/Employee';
import User from '../../auth/models/User';

class InventoryExportService {
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

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'BIS Inventory';
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
<p class="footer">BIS - Bebang Sistem Informasi</p>
</body></html>`;

        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '15mm', bottom: '15mm', left: '10mm', right: '10mm' } });
        await browser.close();

        return Buffer.from(pdfBuffer);
    }
}

export default new InventoryExportService();
