import { Model, ModelStatic, Op } from 'sequelize';
import cacheService from './cache.service';

export interface MasterDataConfig {
    /** model.name -> code prefix, e.g. { Divisi: 'DIV' } */
    codePrefixMap: Record<string, string>;
    /** model.name -> url slug, e.g. { Divisi: 'divisi' } */
    modelSlugMap: Record<string, string>;
    /** cache key namespace, e.g. 'master_data' | 'inv_master_data' | 'facility_master_data' */
    cacheNamespace: string;
    /** API base for cache invalidation, e.g. 'hr' | 'inventory' | 'facility' */
    apiBase: string;
    /** the field searched for a matching `nama`-like column (default 'nama') */
    searchNameField?: string;
}

/**
 * Shared CRUD/list/soft-delete logic for the master-data services in the HR,
 * inventory, and facility modules. The three previously duplicated ~150 lines
 * each; they now subclass this base and only supply their config maps.
 */
export class BaseMasterDataService {
    constructor(protected readonly config: MasterDataConfig) {}

    async generateCode(model: ModelStatic<Model>): Promise<string> {
        const prefix = this.config.codePrefixMap[model.name];
        if (!prefix) throw new Error(`No code prefix configured for model ${model.name}`);

        const lastRecord = await model.findOne({
            where: { code: { [Op.like]: `${prefix}-%` } },
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
        const nameField = this.config.searchNameField || 'nama';
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
                { [nameField]: { [Op.iLike]: `%${search}%` } },
                { code: { [Op.iLike]: `%${search}%` } },
            ];
        }

        const { count, rows } = await model.findAndCountAll({
            where,
            include,
            limit: Number(limit),
            offset: Number(offset),
            order: [['id', 'ASC']],
            distinct: true,
        });

        return {
            data: rows,
            total: count,
            page: Number(page),
            totalPages: Math.ceil(count / Number(limit)),
        };
    }

    async findAll(model: ModelStatic<Model>) {
        const cacheKey = `${this.config.cacheNamespace}:${model.name}:all`;
        return await cacheService.remember(cacheKey, 3600, async () => await model.findAll());
    }

    async findById(model: ModelStatic<Model>, id: number) {
        return await model.findByPk(id);
    }

    async invalidateCache(modelName: string) {
        const slug = this.config.modelSlugMap[modelName] || modelName.toLowerCase();
        await cacheService.delPattern(`${this.config.cacheNamespace}:${modelName}:*`);
        await cacheService.delPattern(`cache:/api/${this.config.apiBase}/master/${slug}*`);
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

        // Because master-data tables are paranoid, destroy() only sets deleted_at
        // and never triggers the DB-level FK RESTRICT — so the catch below is dead
        // for soft-delete. Enforce "still in use" at the app layer first.
        await this.assertNotReferenced(model, id);

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

    /**
     * Reject deletion when any live row in another table still references this
     * master-data row. FK metadata is read from information_schema (trusted), the
     * id is parameterized, and child tables with a `deleted_at` column only count
     * their non-soft-deleted rows.
     */
    private async assertNotReferenced(model: ModelStatic<Model>, id: number) {
        const sequelize = (model as any).sequelize;
        if (!sequelize) return;
        const parentTable = model.getTableName() as string;

        const [refs] = await sequelize.query(
            `SELECT tc.table_name AS child_table, kcu.column_name AS child_col
             FROM information_schema.table_constraints tc
             JOIN information_schema.key_column_usage kcu
               ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
             JOIN information_schema.constraint_column_usage ccu
               ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
             WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = :parentTable`,
            { replacements: { parentTable } }
        );

        for (const ref of refs as Array<{ child_table: string; child_col: string }>) {
            const [cols] = await sequelize.query(
                `SELECT 1 FROM information_schema.columns
                 WHERE table_name = :t AND column_name = 'deleted_at' LIMIT 1`,
                { replacements: { t: ref.child_table } }
            );
            const softDeleteClause = (cols as any[]).length > 0 ? ' AND deleted_at IS NULL' : '';
            const [countRows] = await sequelize.query(
                `SELECT COUNT(*)::int AS n FROM "${ref.child_table}"
                 WHERE "${ref.child_col}" = :id${softDeleteClause}`,
                { replacements: { id } }
            );
            const n = (countRows as any[])[0]?.n ?? 0;
            if (n > 0) {
                const error: any = new Error(
                    `Tidak dapat menghapus data ${model.name} karena masih digunakan oleh data lain.`
                );
                error.statusCode = 409;
                throw error;
            }
        }
    }

    async restore(model: ModelStatic<Model>, id: number) {
        const item = await model.findByPk(id, { paranoid: false });
        if (!item) return null;
        await (item as any).restore();
        await this.invalidateCache(model.name);
        return item;
    }
}

export default BaseMasterDataService;
