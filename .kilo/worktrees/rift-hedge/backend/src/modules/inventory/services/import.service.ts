import ExcelJS from 'exceljs';
import sequelize from '../../../config/database';
import InvProduk from '../models/Produk';
import InvBrand from '../models/Brand';
import InvUom from '../models/Uom';
import InvGudang from '../models/Gudang';
import InvStok from '../models/Stok';
import InvSerialNumber from '../models/SerialNumber';
import InvTransaksi from '../models/Transaksi';
import InvTransaksiDetail from '../models/TransaksiDetail';

interface ImportError {
    row: number;
    field?: string;
    message: string;
    data?: any;
}

interface ImportResult {
    success: number;
    failed: number;
    total: number;
    errors: ImportError[];
}

class InventoryImportService {
    async parseExcelFile(filePath: string): Promise<{ rows: any[]; headers: string[] }> {
        const workbook = new ExcelJS.Workbook();
        try {
            await workbook.xlsx.readFile(filePath);
        } catch (error: any) {
            throw new Error(`Gagal membaca file Excel: ${error.message}`);
        }

        const worksheet = workbook.worksheets[0];
        if (!worksheet) throw new Error('File Excel tidak memiliki worksheet.');

        const headers: string[] = [];
        worksheet.getRow(1).eachCell((cell, colNumber) => {
            headers[colNumber] = cell.text ? cell.text.trim() : '';
        });

        if (headers.length === 0) throw new Error('Header tidak ditemukan di baris 1.');

        const rows: any[] = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            const rowData: any = {};
            row.eachCell((cell, colNumber) => {
                const header = headers[colNumber];
                if (header) {
                    rowData[header] = cell.text ? cell.text.trim() : '';
                }
            });
            if (Object.keys(rowData).length > 0) {
                rows.push({ ...rowData, _rowNumber: rowNumber });
            }
        });

        if (rows.length === 0) throw new Error('Tidak ada data yang ditemukan.');

        return { rows, headers: headers.filter(Boolean) };
    }

    async importProduk(filePath: string): Promise<ImportResult> {
        const { rows } = await this.parseExcelFile(filePath);

        const brands = await InvBrand.findAll({ where: { status: 'Aktif' }, raw: true });
        const brandMap = new Map(brands.map(b => [b.nama.toLowerCase(), b.id]));

        const result: ImportResult = { success: 0, failed: 0, total: rows.length, errors: [] };

        for (const row of rows) {
            try {
                const nama = row['Nama Produk'] || row['nama'];
                if (!nama) {
                    result.errors.push({ row: row._rowNumber, field: 'nama', message: 'Nama produk harus diisi' });
                    result.failed++;
                    continue;
                }

                const brandName = (row['Brand'] || row['brand'] || '').toLowerCase();
                const brandId = brandMap.get(brandName);
                if (!brandId) {
                    result.errors.push({ row: row._rowNumber, field: 'brand', message: `Brand "${row['Brand'] || row['brand']}" tidak ditemukan` });
                    result.failed++;
                    continue;
                }

                const hasSerial = ['ya', 'yes', '1', 'true'].includes((row['Serial Number'] || row['has_serial_number'] || '').toLowerCase());
                const stokMin = parseInt(row['Stok Minimum'] || row['stok_minimum'] || '5', 10);

                await InvProduk.create({
                    nama,
                    brand_id: brandId,
                    has_serial_number: hasSerial,
                    stok_minimum: isNaN(stokMin) ? 5 : stokMin,
                    keterangan: row['Keterangan'] || row['keterangan'] || null,
                    status: 'Aktif',
                } as any);

                result.success++;
            } catch (error: any) {
                result.errors.push({ row: row._rowNumber, message: error.message || 'Gagal import', data: row });
                result.failed++;
            }
        }

        return result;
    }

    async importStokMasuk(filePath: string, userId: number): Promise<ImportResult> {
        const { rows } = await this.parseExcelFile(filePath);

        const produkList = await InvProduk.findAll({ where: { status: 'Aktif' }, raw: true });
        const produkMap = new Map(produkList.map(p => [p.code?.toLowerCase(), p]));
        const produkNameMap = new Map(produkList.map(p => [p.nama.toLowerCase(), p]));

        const uomList = await InvUom.findAll({ where: { status: 'Aktif' }, raw: true });
        const uomMap = new Map(uomList.map(u => [u.nama.toLowerCase(), u.id]));

        const gudangList = await InvGudang.findAll({ where: { status: 'Aktif' }, raw: true });
        const gudangMap = new Map(gudangList.map(g => [g.nama.toLowerCase(), g.id]));

        const result: ImportResult = { success: 0, failed: 0, total: rows.length, errors: [] };

        const t = await sequelize.transaction();
        try {
            const grouped = new Map<string, { produk: any; uom_id: number; gudang_id: number; jumlah: number; serial_numbers: string[]; rowNum: number }>();

            for (const row of rows) {
                const produkCode = (row['Kode Produk'] || row['code'] || '').toLowerCase();
                const produkNama = (row['Nama Produk'] || row['nama'] || '').toLowerCase();
                const produk = produkMap.get(produkCode) || produkNameMap.get(produkNama);

                if (!produk) {
                    result.errors.push({ row: row._rowNumber, field: 'produk', message: `Produk "${row['Kode Produk'] || row['Nama Produk']}" tidak ditemukan` });
                    result.failed++;
                    continue;
                }

                const uomName = (row['UOM'] || row['Satuan'] || '').toLowerCase();
                const uomId = uomMap.get(uomName);
                if (!uomId) {
                    result.errors.push({ row: row._rowNumber, field: 'uom', message: `UOM "${row['UOM'] || row['Satuan']}" tidak ditemukan` });
                    result.failed++;
                    continue;
                }

                const gudangName = (row['Gudang'] || row['gudang'] || '').toLowerCase();
                const gudangId = gudangMap.get(gudangName);
                if (!gudangId) {
                    result.errors.push({ row: row._rowNumber, field: 'gudang', message: `Gudang "${row['Gudang'] || row['gudang']}" tidak ditemukan` });
                    result.failed++;
                    continue;
                }

                const jumlah = parseInt(row['Jumlah'] || row['jumlah'] || '0', 10);
                if (isNaN(jumlah) || jumlah <= 0) {
                    result.errors.push({ row: row._rowNumber, field: 'jumlah', message: 'Jumlah harus lebih dari 0' });
                    result.failed++;
                    continue;
                }

                const sn = row['Serial Number'] || row['serial_number'] || '';
                const serialNumbers = sn ? sn.split(',').map((s: string) => s.trim()).filter(Boolean) : [];

                const key = `${produk.id}-${gudangId}-${uomId}`;
                const existing = grouped.get(key);
                if (existing) {
                    existing.jumlah += jumlah;
                    existing.serial_numbers.push(...serialNumbers);
                } else {
                    grouped.set(key, { produk, uom_id: uomId, gudang_id: gudangId, jumlah, serial_numbers: serialNumbers, rowNum: row._rowNumber });
                }
                result.success++;
            }

            if (grouped.size > 0) {
                const transaksi = await InvTransaksi.create({
                    tipe: 'Masuk',
                    sub_tipe: 'Supplier',
                    tanggal: new Date(),
                    gudang_id: grouped.values().next().value!.gudang_id,
                    catatan: 'Import dari Excel',
                    created_by: userId,
                } as any, { transaction: t });

                for (const [, item] of grouped) {
                    await InvTransaksiDetail.create({
                        transaksi_id: transaksi.id,
                        produk_id: item.produk.id,
                        uom_id: item.uom_id,
                        jumlah: item.jumlah,
                    } as any, { transaction: t });

                    const [stok] = await InvStok.findOrCreate({
                        where: { produk_id: item.produk.id, gudang_id: item.gudang_id, uom_id: item.uom_id },
                        defaults: { produk_id: item.produk.id, gudang_id: item.gudang_id, uom_id: item.uom_id, jumlah: 0 } as any,
                        transaction: t,
                    });
                    await stok.update({ jumlah: (stok as any).jumlah + item.jumlah }, { transaction: t });

                    if (item.produk.has_serial_number && item.serial_numbers.length > 0) {
                        for (const sn of item.serial_numbers) {
                            await InvSerialNumber.create({
                                produk_id: item.produk.id,
                                serial_number: sn,
                                gudang_id: item.gudang_id,
                                status: 'Tersedia',
                                transaksi_masuk_id: transaksi.id,
                                transaksi_terakhir_id: transaksi.id,
                            } as any, { transaction: t });
                        }
                    }
                }
            }

            await t.commit();
        } catch (error: any) {
            await t.rollback();
            throw new Error(`Gagal import stok: ${error.message}`);
        }

        return result;
    }

    async generateErrorReport(errors: ImportError[]): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Error Report');

        sheet.columns = [
            { header: 'Baris', key: 'row', width: 10 },
            { header: 'Field', key: 'field', width: 20 },
            { header: 'Pesan Error', key: 'message', width: 50 },
        ];

        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6B6B' } };

        errors.forEach(err => {
            sheet.addRow({ row: err.row, field: err.field || '-', message: err.message });
        });

        return Buffer.from(await workbook.xlsx.writeBuffer());
    }
}

export default new InventoryImportService();
