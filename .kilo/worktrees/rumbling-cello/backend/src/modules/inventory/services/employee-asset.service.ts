import puppeteer from 'puppeteer';
import InvSerialNumber from '../models/SerialNumber';
import InvTransaksi from '../models/Transaksi';
import InvTransaksiDetail from '../models/TransaksiDetail';
import InvProduk from '../models/Produk';
import InvGudang from '../models/Gudang';
import InvUom from '../models/Uom';
import InvBrand from '../models/Brand';
import Employee from '../../hr/models/Employee';
import { AppError } from '../../../shared/utils/errorHandler';

class EmployeeAssetService {
    async getEmployeeAssets(employeeId: number) {
        const assets = await InvSerialNumber.findAll({
            where: { karyawan_id: employeeId },
            include: [
                {
                    model: InvProduk, as: 'produk', attributes: ['id', 'code', 'nama'],
                    include: [{ model: InvBrand, as: 'brand', attributes: ['id', 'nama'] }],
                },
                { model: InvGudang, as: 'gudang', attributes: ['id', 'code', 'nama'] },
                { model: InvTransaksi, as: 'transaksi_terakhir', attributes: ['id', 'code', 'tanggal', 'sub_tipe'] },
            ],
            order: [['created_at', 'DESC']],
        });

        return assets;
    }

    async getEmployeeAssetHistory(employeeId: number) {
        const transaksi = await InvTransaksi.findAll({
            where: { karyawan_id: employeeId },
            include: [
                { model: InvGudang, as: 'gudang', attributes: ['id', 'code', 'nama'] },
                {
                    model: InvTransaksiDetail, as: 'details',
                    include: [
                        { model: InvProduk, as: 'produk', attributes: ['id', 'code', 'nama'] },
                        { model: InvUom, as: 'uom', attributes: ['id', 'nama'] },
                    ],
                },
            ],
            order: [['created_at', 'DESC']],
        });

        return transaksi;
    }

    async generateBeritaAcara(employeeId: number, transaksiId?: number): Promise<Buffer> {
        const employee = await Employee.findByPk(employeeId);
        if (!employee) throw new AppError('Karyawan tidak ditemukan', 404);

        let items: any[] = [];
        let transaksiInfo: any = null;

        if (transaksiId) {
            const transaksi = await InvTransaksi.findByPk(transaksiId, {
                include: [{
                    model: InvTransaksiDetail, as: 'details',
                    include: [
                        { model: InvProduk, as: 'produk', attributes: ['id', 'code', 'nama'] },
                        { model: InvUom, as: 'uom', attributes: ['id', 'nama'] },
                    ],
                }],
            });
            if (!transaksi) throw new AppError('Transaksi tidak ditemukan', 404);
            transaksiInfo = transaksi;
            items = (transaksi as any).details || [];
        } else {
            const assets = await InvSerialNumber.findAll({
                where: { karyawan_id: employeeId },
                include: [
                    { model: InvProduk, as: 'produk', attributes: ['id', 'code', 'nama'] },
                    { model: InvTransaksi, as: 'transaksi_terakhir', attributes: ['id', 'code', 'tanggal'] },
                ],
            });
            items = assets;
        }

        const tanggal = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

        const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
body { font-family: 'Times New Roman', serif; font-size: 12px; margin: 30px 40px; line-height: 1.6; }
h1 { font-size: 16px; text-align: center; text-decoration: underline; margin-bottom: 4px; }
h2 { font-size: 13px; text-align: center; margin-top: 0; font-weight: normal; }
.info-table { margin: 15px 0; }
.info-table td { padding: 2px 8px; vertical-align: top; }
.info-table td:first-child { width: 180px; }
table.items { width: 100%; border-collapse: collapse; margin: 15px 0; }
table.items th, table.items td { border: 1px solid #333; padding: 6px 8px; text-align: left; }
table.items th { background: #f0f0f0; font-weight: bold; }
.signatures { display: flex; justify-content: space-between; margin-top: 50px; }
.sig-block { text-align: center; width: 200px; }
.sig-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 4px; }
</style></head><body>
<h1>BERITA ACARA SERAH TERIMA BARANG</h1>
<h2>${transaksiInfo ? `No: ${transaksiInfo.code}` : `Daftar Aset Aktif`}</h2>

<p>Pada hari ini, ${tanggal}, telah dilaksanakan serah terima barang inventaris kepada:</p>

<table class="info-table">
<tr><td>Nama</td><td>: <strong>${(employee as any).nama_lengkap}</strong></td></tr>
<tr><td>NIK</td><td>: ${(employee as any).nomor_induk_karyawan || '-'}</td></tr>
</table>

<p>Dengan rincian barang sebagai berikut:</p>

<table class="items">
<thead><tr><th>No</th><th>Kode Produk</th><th>Nama Barang</th>${transaksiId ? '<th>Jumlah</th><th>UOM</th>' : '<th>Serial Number</th><th>Status</th>'}</tr></thead>
<tbody>
${items.map((item: any, idx: number) => {
    if (transaksiId) {
        return `<tr><td>${idx + 1}</td><td>${item.produk?.code || '-'}</td><td>${item.produk?.nama || '-'}</td><td>${item.jumlah}</td><td>${item.uom?.nama || '-'}</td></tr>`;
    }
    return `<tr><td>${idx + 1}</td><td>${item.produk?.code || '-'}</td><td>${item.produk?.nama || '-'}</td><td>${item.serial_number}</td><td>${item.status}</td></tr>`;
}).join('')}
</tbody></table>

<p>Demikian berita acara ini dibuat untuk dapat dipergunakan sebagaimana mestinya.</p>

<div class="signatures">
<div class="sig-block"><p>Yang Menyerahkan,</p><div class="sig-line">(_________________)</div></div>
<div class="sig-block"><p>Yang Menerima,</p><div class="sig-line">(${(employee as any).nama_lengkap})</div></div>
</div>
</body></html>`;

        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' } });
        await browser.close();

        return Buffer.from(pdfBuffer);
    }
}

export default new EmployeeAssetService();
