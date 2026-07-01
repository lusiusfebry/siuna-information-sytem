import { Request, Response, NextFunction } from 'express';
import masterDataService from '../services/master-data.service';
import * as models from '../models';
import { Employee } from '../../hr/models';
import LokasiKerja from '../../hr/models/LokasiKerja';

class InventoryMasterDataController {
    private getModel(modelName: string) {
        const map: { [key: string]: string } = {
            'kategori': 'InvKategori',
            'sub-kategori': 'InvSubKategori',
            'brand': 'InvBrand',
            'uom': 'InvUom',
            'produk': 'InvProduk',
            'gudang': 'InvGudang',
        };

        const normalizedKey = modelName.replace(/_/g, '-');
        const key = map[normalizedKey];
        return key ? (models as any)[key] : null;
    }

    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const modelName = req.params.model;
            const model = this.getModel(modelName);
            if (!model) return res.status(404).json({ message: 'Resource not found' });

            const include: any[] = [];
            if (modelName === 'sub-kategori' || modelName === 'sub_kategori') {
                include.push({ association: 'kategori' });
            } else if (modelName === 'brand') {
                include.push({ association: 'sub_kategori' });
            } else if (modelName === 'produk') {
                include.push({ association: 'brand' });
            } else if (modelName === 'gudang') {
                include.push({ association: 'penanggung_jawab' });
                include.push({ association: 'department' });
                include.push({ association: 'lokasi_kerja' });
            }

            const result = await masterDataService.findAllWithFilter(model, req.query, include);

            res.json({
                status: 'success',
                data: result.data,
                pagination: {
                    total: result.total,
                    page: result.page,
                    totalPages: result.totalPages
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async getOne(req: Request, res: Response, next: NextFunction) {
        try {
            const model = this.getModel(req.params.model);
            if (!model) return res.status(404).json({ message: 'Resource not found' });

            const data = await masterDataService.findById(model, Number(req.params.id));
            if (!data) return res.status(404).json({ message: 'Item not found' });

            res.json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const model = this.getModel(req.params.model);
            if (!model) return res.status(404).json({ message: 'Resource not found' });

            const normalizedModel = req.params.model.replace(/_/g, '-');

            if (normalizedModel === 'sub-kategori' && req.body.kategori_id) {
                const kategori = await (models as any).InvKategori.findByPk(req.body.kategori_id);
                if (!kategori) return res.status(400).json({ message: 'Kategori tidak ditemukan' });
            }
            if (normalizedModel === 'brand' && req.body.sub_kategori_id) {
                const subKategori = await (models as any).InvSubKategori.findByPk(req.body.sub_kategori_id);
                if (!subKategori) return res.status(400).json({ message: 'Sub Kategori tidak ditemukan' });
            }
            if (normalizedModel === 'produk' && req.body.brand_id) {
                const brand = await (models as any).InvBrand.findByPk(req.body.brand_id);
                if (!brand) return res.status(400).json({ message: 'Brand tidak ditemukan' });
            }
            if (normalizedModel === 'gudang' && req.body.penanggung_jawab_id) {
                const employee = await Employee.findByPk(req.body.penanggung_jawab_id);
                if (!employee) return res.status(400).json({ message: 'Penanggung jawab tidak ditemukan' });
                if (!req.body.department_id) {
                    req.body.department_id = (employee as any).department_id || null;
                }
            }
            if (normalizedModel === 'gudang' && req.body.lokasi_kerja_id) {
                const lokasi = await LokasiKerja.findByPk(req.body.lokasi_kerja_id);
                if (!lokasi) return res.status(400).json({ message: 'Lokasi kerja tidak ditemukan' });
            }

            const data = await masterDataService.create(model, req.body);
            res.status(201).json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const model = this.getModel(req.params.model);
            if (!model) return res.status(404).json({ message: 'Resource not found' });

            const normalizedModel = req.params.model.replace(/_/g, '-');

            if (normalizedModel === 'sub-kategori' && req.body.kategori_id) {
                const kategori = await (models as any).InvKategori.findByPk(req.body.kategori_id);
                if (!kategori) return res.status(400).json({ message: 'Kategori tidak ditemukan' });
            }
            if (normalizedModel === 'brand' && req.body.sub_kategori_id) {
                const subKategori = await (models as any).InvSubKategori.findByPk(req.body.sub_kategori_id);
                if (!subKategori) return res.status(400).json({ message: 'Sub Kategori tidak ditemukan' });
            }
            if (normalizedModel === 'produk' && req.body.brand_id) {
                const brand = await (models as any).InvBrand.findByPk(req.body.brand_id);
                if (!brand) return res.status(400).json({ message: 'Brand tidak ditemukan' });
            }
            if (normalizedModel === 'gudang' && req.body.penanggung_jawab_id) {
                const employee = await Employee.findByPk(req.body.penanggung_jawab_id);
                if (!employee) return res.status(400).json({ message: 'Penanggung jawab tidak ditemukan' });
                if (!req.body.department_id) {
                    req.body.department_id = (employee as any).department_id || null;
                }
            }
            if (normalizedModel === 'gudang' && req.body.lokasi_kerja_id) {
                const lokasi = await LokasiKerja.findByPk(req.body.lokasi_kerja_id);
                if (!lokasi) return res.status(400).json({ message: 'Lokasi kerja tidak ditemukan' });
            }

            const data = await masterDataService.update(model, Number(req.params.id), req.body);
            if (!data) return res.status(404).json({ message: 'Item not found' });

            res.json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const model = this.getModel(req.params.model);
            if (!model) return res.status(404).json({ message: 'Resource not found' });

            const success = await masterDataService.delete(model, Number(req.params.id));
            if (!success) return res.status(404).json({ message: 'Item not found' });

            res.json({ status: 'success', message: 'Item archived successfully' });
        } catch (error) {
            next(error);
        }
    }

    async restore(req: Request, res: Response, next: NextFunction) {
        try {
            const model = this.getModel(req.params.model);
            if (!model) return res.status(404).json({ message: 'Resource not found' });

            const data = await masterDataService.restore(model, Number(req.params.id));
            if (!data) return res.status(404).json({ message: 'Item not found' });

            res.json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    }

    async uploadPhoto(req: Request, res: Response, next: NextFunction) {
        try {
            const produk = await (models as any).InvProduk.findByPk(Number(req.params.id));
            if (!produk) return res.status(404).json({ message: 'Produk tidak ditemukan' });

            if (!req.file) return res.status(400).json({ message: 'File gambar harus diupload' });

            const gambarPath = `/uploads/inventory/photos/${req.file.filename}`;
            await produk.update({ gambar: gambarPath });

            res.json({ status: 'success', data: { gambar: gambarPath } });
        } catch (error) {
            next(error);
        }
    }
}

export default new InventoryMasterDataController();
