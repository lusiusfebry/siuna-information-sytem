import QRCode from 'qrcode';
import puppeteer from 'puppeteer';
import { Op } from 'sequelize';
import InvProduk from '../models/Produk';
import InvSerialNumber from '../models/SerialNumber';
import InvGudang from '../models/Gudang';
import InvBrand from '../models/Brand';
import Employee from '../../hr/models/Employee';
import { AppError } from '../../../shared/utils/errorHandler';
import companySettingsService from '../../auth/services/company-settings.service';

interface PrintConfig {
    paperType: 'a4' | 'thermal';
    thermalSize?: '50x30' | '70x40' | '100x50';
    columns?: number;
}

const THERMAL_SIZES: Record<string, { w: number; h: number; qr: number; companyFont: number; nameFont: number; codeFont: number }> = {
    '50x30': { w: 50, h: 30, qr: 22, companyFont: 6, nameFont: 6, codeFont: 7 },
    '70x40': { w: 70, h: 40, qr: 30, companyFont: 7, nameFont: 7, codeFont: 8 },
    '100x50': { w: 100, h: 50, qr: 40, companyFont: 8, nameFont: 8, codeFont: 10 },
};

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

    private async batchFetchLabels(items: Array<{ type: 'produk' | 'serial_number' | 'asset_tag'; id: number }>) {
        const settings = await companySettingsService.getSettings();
        const labels: Array<{ qr: string; line1: string; line2: string; line3?: string; isAssetTag?: boolean }> = [];

        const produkIds = items.filter(i => i.type === 'produk').map(i => i.id);
        const snIds = items.filter(i => i.type === 'serial_number').map(i => i.id);
        const tagIds = items.filter(i => i.type === 'asset_tag').map(i => i.id);

        const [produks, serialNumbers, assetTags] = await Promise.all([
            produkIds.length > 0
                ? InvProduk.findAll({
                    where: { id: { [Op.in]: produkIds } },
                    include: [{ model: InvBrand, as: 'brand', attributes: ['id', 'nama'] }],
                })
                : [],
            snIds.length > 0
                ? InvSerialNumber.findAll({
                    where: { id: { [Op.in]: snIds } },
                    include: [{ model: InvProduk, as: 'produk', attributes: ['id', 'code', 'nama'] }],
                })
                : [],
            tagIds.length > 0
                ? InvSerialNumber.findAll({
                    where: { id: { [Op.in]: tagIds }, tag_number: { [Op.not]: null } },
                    include: [{ model: InvProduk, as: 'produk', attributes: ['id', 'code', 'nama'] }],
                })
                : [],
        ]);

        const produkMap = new Map(produks.map((p: any) => [p.id, p]));
        const snMap = new Map(serialNumbers.map((s: any) => [s.id, s]));
        const tagMap = new Map(assetTags.map((t: any) => [t.id, t]));

        for (const item of items) {
            if (item.type === 'produk') {
                const produk = produkMap.get(item.id);
                if (!produk) continue;
                const qrData = `INV:PRODUK:${produk.code}`;
                const qr = await QRCode.toDataURL(qrData, { width: 200, margin: 1 });
                labels.push({ qr, line1: produk.code, line2: produk.nama });
            } else if (item.type === 'asset_tag') {
                const tag = tagMap.get(item.id);
                if (!tag) continue;
                const qrData = `INV:TAG:${tag.tag_number}`;
                const qr = await QRCode.toDataURL(qrData, { width: 200, margin: 1 });
                labels.push({
                    qr,
                    line1: settings.company_legal_name,
                    line2: tag.produk?.nama || '',
                    line3: tag.tag_number,
                    isAssetTag: true,
                });
            } else {
                const sn = snMap.get(item.id);
                if (!sn) continue;
                const qrData = `INV:SN:${sn.serial_number}`;
                const qr = await QRCode.toDataURL(qrData, { width: 200, margin: 1 });
                labels.push({ qr, line1: sn.serial_number, line2: sn.produk?.nama || '' });
            }
        }

        return labels;
    }

    private buildA4Html(labels: Array<{ qr: string; line1: string; line2: string; line3?: string; isAssetTag?: boolean }>, columns: number): string {
        const colWidth = (100 / columns).toFixed(2);
        const rows: string[] = [];
        for (let i = 0; i < labels.length; i += columns) {
            const rowLabels = labels.slice(i, i + columns);
            rows.push(`<tr>${rowLabels.map(l => `
                <td class="label${l.isAssetTag ? ' asset-tag' : ''}">
                    <img src="${l.qr}" width="80" height="80" />
                    <div class="${l.isAssetTag ? 'company' : 'code'}">${l.line1}</div>
                    <div class="name">${l.line2}</div>
                    ${l.line3 ? `<div class="code">${l.line3}</div>` : ''}
                </td>
            `).join('')}</tr>`);
        }

        return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
body { font-family: Arial, sans-serif; margin: 10mm; }
table { border-collapse: collapse; width: 100%; }
td.label { width: ${colWidth}%; border: 1px dashed #ccc; padding: 8px; text-align: center; vertical-align: top; height: 120px; }
td.label.asset-tag { height: 140px; }
td.label img { display: block; margin: 0 auto 4px; }
.code { font-size: 10px; font-weight: bold; font-family: monospace; }
.company { font-size: 9px; font-weight: bold; color: #333; margin-bottom: 1px; }
.name { font-size: 9px; color: #555; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px; margin: 2px auto 0; }
</style></head><body>
<table>${rows.join('')}</table>
</body></html>`;
    }

    private buildThermalHtml(labels: Array<{ qr: string; line1: string; line2: string; line3?: string; isAssetTag?: boolean }>, size: string): string {
        const cfg = THERMAL_SIZES[size] || THERMAL_SIZES['70x40'];
        const pages = labels.map((l, idx) => `
            <div class="label-page" ${idx < labels.length - 1 ? 'style="page-break-after: always;"' : ''}>
                <img src="${l.qr}" class="qr" />
                <div class="text">
                    ${l.isAssetTag ? `<div class="company">${l.line1}</div>` : `<div class="code">${l.line1}</div>`}
                    <div class="name">${l.line2}</div>
                    ${l.line3 ? `<div class="code">${l.line3}</div>` : ''}
                </div>
            </div>
        `).join('');

        return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Arial, sans-serif; }
.label-page {
    width: ${cfg.w}mm; height: ${cfg.h}mm;
    display: flex; align-items: center; justify-content: center;
    gap: 2mm; padding: 1mm;
}
.qr { width: ${cfg.qr}mm; height: ${cfg.qr}mm; flex-shrink: 0; }
.text { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; gap: 0.5mm; }
.company { font-size: ${cfg.companyFont}pt; font-weight: bold; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.name { font-size: ${cfg.nameFont}pt; color: #555; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.code { font-size: ${cfg.codeFont}pt; font-weight: bold; font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style></head><body>
${pages}
</body></html>`;
    }

    async generateLabelPDF(
        items: Array<{ type: 'produk' | 'serial_number' | 'asset_tag'; id: number }>,
        config: PrintConfig = { paperType: 'a4', columns: 3 }
    ): Promise<Buffer> {
        const labels = await this.batchFetchLabels(items);
        if (labels.length === 0) throw new AppError('Tidak ada label yang bisa dicetak', 400);

        const isThermal = config.paperType === 'thermal';
        const html = isThermal
            ? this.buildThermalHtml(labels, config.thermalSize || '70x40')
            : this.buildA4Html(labels, config.columns || 3);

        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        let pdfOptions: any;
        if (isThermal) {
            const sz = THERMAL_SIZES[config.thermalSize || '70x40'] || THERMAL_SIZES['70x40'];
            pdfOptions = {
                width: `${sz.w}mm`,
                height: `${sz.h}mm`,
                printBackground: true,
                margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
            };
        } else {
            pdfOptions = {
                format: 'A4',
                printBackground: true,
                margin: { top: '5mm', bottom: '5mm', left: '5mm', right: '5mm' },
            };
        }

        const pdfBuffer = await page.pdf(pdfOptions);
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
