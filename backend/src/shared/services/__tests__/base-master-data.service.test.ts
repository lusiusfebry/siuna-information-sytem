import { BaseMasterDataService } from '../base-master-data.service';

// Locks B-7: master-data delete must reject (409) when another table still
// references the row (app-level guard, since paranoid soft-delete means the DB
// FK RESTRICT never fires), and allow deletion when nothing references it.
jest.mock('../cache.service', () => ({ __esModule: true, default: { delPattern: jest.fn() } }));

const svc = new BaseMasterDataService({
    codePrefixMap: { Divisi: 'DIV' },
    modelSlugMap: { Divisi: 'divisi' },
    cacheNamespace: 'master_data',
    apiBase: 'hr',
});

// Build a fake model whose sequelize.query returns scripted results in call order.
const makeModel = (destroy: jest.Mock, queryResults: any[]) => {
    const query = jest.fn();
    queryResults.forEach(r => query.mockResolvedValueOnce(r));
    return {
        name: 'Divisi',
        getTableName: () => 'divisi',
        findByPk: jest.fn().mockResolvedValue({ destroy }),
        sequelize: { query },
        _query: query,
    } as any;
};

describe('BaseMasterDataService.delete reference guard (B-7)', () => {
    it('throws 409 when a referencing row still exists', async () => {
        const destroy = jest.fn();
        // 1st query: FK refs -> department.divisi_id references divisi
        // 2nd query: does department have deleted_at? -> yes
        // 3rd query: count live referencing rows -> 1
        const model = makeModel(destroy, [
            [[{ child_table: 'department', child_col: 'divisi_id' }]],
            [[{ '?column?': 1 }]],
            [[{ n: 1 }]],
        ]);
        await expect(svc.delete(model, 5)).rejects.toMatchObject({ statusCode: 409 });
        expect(destroy).not.toHaveBeenCalled();
    });

    it('deletes when no referencing rows exist', async () => {
        const destroy = jest.fn().mockResolvedValue(undefined);
        const model = makeModel(destroy, [
            [[{ child_table: 'department', child_col: 'divisi_id' }]],
            [[]],            // department has no deleted_at column
            [[{ n: 0 }]],    // zero referencing rows
        ]);
        const res = await svc.delete(model, 5);
        expect(res).toBe(true);
        expect(destroy).toHaveBeenCalledTimes(1);
    });

    it('deletes when the table is referenced by nothing at all', async () => {
        const destroy = jest.fn().mockResolvedValue(undefined);
        const model = makeModel(destroy, [
            [[]], // no FK references this table
        ]);
        const res = await svc.delete(model, 5);
        expect(res).toBe(true);
        expect(destroy).toHaveBeenCalledTimes(1);
    });

    it('returns null when the row does not exist', async () => {
        const model = makeModel(jest.fn(), []);
        model.findByPk = jest.fn().mockResolvedValue(null);
        expect(await svc.delete(model, 999)).toBeNull();
    });
});
