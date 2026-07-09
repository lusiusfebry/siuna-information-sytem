import BaseMasterDataService from '../../../shared/services/base-master-data.service';

const CODE_PREFIX_MAP: Record<string, string> = {
    'InvKategori': 'IKT',
    'InvSubKategori': 'ISK',
    'InvBrand': 'IBR',
    'InvUom': 'IUM',
    'InvProduk': 'IPR',
    'InvGudang': 'IGD',
};

const MODEL_SLUG_MAP: Record<string, string> = {
    'InvKategori': 'kategori',
    'InvSubKategori': 'sub-kategori',
    'InvBrand': 'brand',
    'InvUom': 'uom',
    'InvProduk': 'produk',
    'InvGudang': 'gudang',
};

class InventoryMasterDataService extends BaseMasterDataService {
    constructor() {
        super({
            codePrefixMap: CODE_PREFIX_MAP,
            modelSlugMap: MODEL_SLUG_MAP,
            cacheNamespace: 'inv_master_data',
            apiBase: 'inventory',
        });
    }
}

export default new InventoryMasterDataService();
