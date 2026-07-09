import BaseMasterDataService from '../../../shared/services/base-master-data.service';

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

class MasterDataService extends BaseMasterDataService {
    constructor() {
        super({
            codePrefixMap: CODE_PREFIX_MAP,
            modelSlugMap: MODEL_SLUG_MAP,
            cacheNamespace: 'master_data',
            apiBase: 'hr',
        });
    }
}

export default new MasterDataService();
