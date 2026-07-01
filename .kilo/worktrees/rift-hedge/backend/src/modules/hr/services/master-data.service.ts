import { Model, ModelStatic, Op } from 'sequelize';
import cacheService from '../../../shared/services/cache.service';

const CODE_PREFIX_MAP: Record<string, string> = {
    'Divisi': 'DIV',
    'Department': 'DEP',
    'PosisiJabatan': 'POS',
    'KategoriPangkat': 'KAT',
    'Golongan': 'GOL',
    'SubGolongan': 'SUB',
    'JenisHubunganKerja': 'JHK',
    'Tag': 'TAG',
    'LokasiKerja': 'LOK',
    'StatusKaryawan': 'STK',
};

const MODEL_SLUG_MAP: Record<string, string> = {
    'Divisi': 'divisi',
    'Department': 'department',
    'PosisiJabatan': 'posisi-jabatan',
    'KategoriPangkat': 'kategori-pangkat',
    'Golongan': 'golongan',
    'SubGolongan': 'sub-golongan',
    'JenisHubunganKerja': 'jenis-hubungan-kerja',
    'Tag': 'tag',
    'LokasiKerja': 'lokasi-kerja',
    'StatusKaryawan': 'status-karyawan',
};

class MasterDataService {
    async generateCode(model: ModelStatic<Model>): Promise<string> {
        const prefix = CODE_PREFIX_MAP[model.name];
        if (!prefix) throw new Error(`No code prefix configured for model ${model.name}`);

        const lastRecord = await model.findOne({
            where: {
                code: { [Op.like]: `${prefix}-%` }
            },
            order: [['code', 'DESC']],
            paranoid: false,
        });

        let nextNumber = 1;
        if (lastRecord) {
            const lastCode = (lastRecord as any).code as string;
            const lastNumber = parseInt(lastCode.split('-')[1], 10);
            if (!isNaN(lastNumber)) nextNumber = lastNumber + 1;
        }

        return `${prefix}-${String(nextNumber).padStart(4, '0')}`;
    }

    async findAllWithFilter(model: ModelStatic<Model>, filters: any, include: any[] = []) {
        const { status, search, page = 1, limit = 10 } = filters;
        const offset = (Number(page) - 1) * Number(limit);
        const where: any = {};

        if (status) {
            if (status === 'true' || status === true || status === 'Aktif') {
                where.status = 'Aktif';
            } else if (status === 'false' || status === false || status === 'Tidak Aktif') {
                where.status = 'Tidak Aktif';
            }
        }

        if (search) {
            where[Op.or] = [
                { nama: { [Op.like]: `%${search}%` } },
                { code: { [Op.like]: `%${search}%` } },
            ];
        }

        const { count, rows } = await model.findAndCountAll({
            where,
            include,
            limit: Number(limit),
            offset: Number(offset),
            order: [['id', 'ASC']],
            distinct: true
        });

        return {
            data: rows,
            total: count,
            page: Number(page),
            totalPages: Math.ceil(count / Number(limit))
        };
    }

    async findAll(model: ModelStatic<Model>) {
        const modelName = model.name;
        const cacheKey = `master_data:${modelName}:all`;

        return await cacheService.remember(
            cacheKey,
            3600,
            async () => await model.findAll()
        );
    }

    async findById(model: ModelStatic<Model>, id: number) {
        return await model.findByPk(id);
    }

    async invalidateCache(modelName: string) {
        const slug = MODEL_SLUG_MAP[modelName] || modelName.toLowerCase();
        await cacheService.delPattern(`master_data:${modelName}:*`);
        await cacheService.delPattern(`cache:/api/hr/master/${slug}*`);
    }

    async create(model: ModelStatic<Model>, data: any) {
        delete data.code;
        const code = await this.generateCode(model);
        const result = await model.create({ ...data, code });
        await this.invalidateCache(model.name);
        return result;
    }

    async update(model: ModelStatic<Model>, id: number, data: any) {
        const item = await model.findByPk(id);
        if (!item) return null;
        delete data.code;
        const result = await item.update(data);
        await this.invalidateCache(model.name);
        return result;
    }

    async delete(model: ModelStatic<Model>, id: number) {
        const item = await model.findByPk(id);
        if (!item) return null;
        try {
            await item.destroy();
        } catch (err: any) {
            const code = err.parent?.code || err.original?.code;
            if (
                err.name === 'SequelizeForeignKeyConstraintError' ||
                code === '23503' ||
                code === '23001'
            ) {
                const error: any = new Error(
                    `Tidak dapat menghapus data ${model.name} karena masih digunakan oleh data lain.`
                );
                error.statusCode = 409;
                throw error;
            }
            throw err;
        }
        await this.invalidateCache(model.name);
        return true;
    }

    async restore(model: ModelStatic<Model>, id: number) {
        const item = await model.findByPk(id, { paranoid: false });
        if (!item) return null;
        await (item as any).restore();
        await this.invalidateCache(model.name);
        return item;
    }
}

export default new MasterDataService();
