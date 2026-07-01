import QRCode from 'qrcode';
import puppeteer from 'puppeteer';
import InvProduk from '../models/Produk';
import InvSerialNumber from '../models/SerialNumber';
import InvGudang from '../models/Gudang';
import InvBrand from '../models/Brand';
import Employee from '../../hr/models/Employee';
import { AppError } from '../../../shared/utils/errorHandler';

class LabelService {
    async generateProductQR(produkId: number): Promise<{ qr: string; produk: any }> {
        const produk = await InvProduk.findByPk(produkId, {
            include: [{ model: InvBrand, as: 'brand', attributes: ['id', 'nama'] }],
        });
        if (!produk) throw new AppError('Produk tidak ditemukan', 404);

        const qrData = `INV:PRODUK:${produk.code}`;
        const qr = await QRCode.toDataURL(qrData, { width: 200, margin: 1 });
        return { qr, produk };
    }

    async generateSerialNumberQR(snId: number): Promise<{ qr: string; serialNumber: any }> {
        const sn = await InvSerialNumber.findByPk(snId, {
            include: [
                { model: InvProduk, as: 'produk', attributes: ['id', 'code', 'nama'] },
                { model: InvGudang, as: 'gudang', attributes: ['id', 'nama'] },
            ],
        });
        if (!sn) throw new AppError('Serial number tidak ditemukan', 404);

        const qrData = `INV:SN:${sn.serial_number}`;
        const qr = await QRCode.toDataURL(qrData, { width: 200, margin: 1 });
        return { qr, serialNumber: sn };
    }

    async generateAssetTagQR(tagId: number): Promise<{ qr: string; assetTag: any }> {
        const tag = await InvSerialNumber.findByPk(tagId, {
            include: [
                { model: InvProduk, as: 'produk', attributes: ['id', 'code', 'nama'] },
                { model: InvGudang, as: 'gudang', attributes: ['id', 'code', 'nama'] },
                { model: Employee, as: 'karyawan', attributes: ['id', 'nama_lengkap'] },
            ],
        });
        if (!tag || !tag.tag_number) throw new AppError('Asset tag tidak ditemukan', 404);

        const qrData = `INV:TAG:${tag.tag_number}`;
        const qr = await QRCode.toDataURL(qrData, { width: 200, margin: 1 });
        return { qr, assetTag: tag };
    }

    async generateLabelPDF(items: Array<{ type: 'produk' | 'serial_number' | 'asset_tag'; id: number }>): Promise<Buffer> {
        const labels: Array<{ qr: string; line1: string; line2: string; line3?: string; isAssetTag?: boolean }> = [];

        for (const item of items) {
            if (item.type === 'produk') {
                const { qr, produk } = await this.generateProductQR(item.id);
                labels.push({ qr, line1: produk.code, line2: produk.nama });
            } else if (item.type === 'asset_tag') {
                const { qr, assetTag } = await this.generateAssetTagQR(item.id);
                labels.push({
                    qr,
                    line1: 'PT Prima Sarana Gemilang',
                    line2: assetTag.produk?.nama || '',
                    line3: assetTag.tag_number,
                    isAssetTag: true,
                });
            } else {
                const { qr, serialNumber } = await this.generateSerialNumberQR(item.id);
                labels.push({ qr, line1: serialNumber.serial_number, line2: serialNumber.produk?.nama || '' });
            }
        }

        const labelsPerRow = 3;
        const rows: string[] = [];
        for (let i = 0; i < labels.length; i += labelsPerRow) {
            const rowLabels = labels.slice(i, i + labelsPerRow);
            rows.push(`<tr>${rowLabels.map(l => `
                <td class="label${l.isAssetTag ? ' asset-tag' : ''}">
                    <img src="${l.qr}" width="80" height="80" />
                    <div class="${l.isAssetTag ? 'company' : 'code'}">${l.line1}</div>
                    <div class="name">${l.line2}</div>
                    ${l.line3 ? `<div class="code">${l.line3}</div>` : ''}
                </td>
            `).join('')}</tr>`);
        }

        const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
body { font-family: Arial, sans-serif; margin: 10mm; }
table { border-collapse: collapse; width: 100%; }
td.label { width: 33.33%; border: 1px dashed #ccc; padding: 8px; text-align: center; vertical-align: top; height: 120px; }
td.label.asset-tag { height: 140px; }
td.label img { display: block; margin: 0 auto 4px; }
.code { font-size: 10px; font-weight: bold; font-family: monospace; }
.company { font-size: 9px; font-weight: bold; color: #333; margin-bottom: 1px; }
.name { font-size: 9px; color: #555; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px; margin: 2px auto 0; }
</style></head><body>
<table>${rows.join('')}</table>
</body></html>`;

        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '5mm', bottom: '5mm', left: '5mm', right: '5mm' } });
        await browser.close();

        return Buffer.from(pdfBuffer);
    }

    async lookupQR(code: string) {
        if (code.startsWith('INV:PRODUK:')) {
            const produkCode = code.replace('INV:PRODUK:', '');
            const produk = await InvProduk.findOne({
                where: { code: produkCode },
                include: [{ model: InvBrand, as: 'brand', attributes: ['id', 'nama'] }],
            });
            if (!produk) throw new AppError('Produk tidak ditemukan', 404);
            return { type: 'produk', data: produk };
        }

        if (code.startsWith('INV:SN:')) {
            const snCode = code.replace('INV:SN:', '');
            const sn = await InvSerialNumber.findOne({
                where: { serial_number: snCode },
                include: [
                    { model: InvProduk, as: 'produk', attributes: ['id', 'code', 'nama'] },
                    { model: InvGudang, as: 'gudang', attributes: ['id', 'code', 'nama'] },
                ],
            });
            if (!sn) throw new AppError('Serial number tidak ditemukan', 404);
            return { type: 'serial_number', data: sn };
        }

        if (code.startsWith('INV:TAG:')) {
            const tagCode = code.replace('INV:TAG:', '');
            const tag = await InvSerialNumber.findOne({
                where: { tag_number: tagCode },
                include: [
                    { model: InvProduk, as: 'produk', attributes: ['id', 'code', 'nama'] },
                    { model: InvGudang, as: 'gudang', attributes: ['id', 'code', 'nama'] },
                    { model: Employee, as: 'karyawan', attributes: ['id', 'nama_lengkap'] },
                ],
            });
            if (!tag) throw new AppError('Asset tag tidak ditemukan', 404);
            return { type: 'asset_tag', data: tag };
        }

        throw new AppError('Format QR code tidak dikenali', 400);
    }
}

export default new LabelService();
