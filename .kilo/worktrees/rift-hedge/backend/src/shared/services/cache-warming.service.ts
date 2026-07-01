import cacheService from './cache.service';
import Divisi from '../../modules/hr/models/Divisi';
import Department from '../../modules/hr/models/Department';
import PosisiJabatan from '../../modules/hr/models/PosisiJabatan';
import StatusKaryawan from '../../modules/hr/models/StatusKaryawan';
import LokasiKerja from '../../modules/hr/models/LokasiKerja';
import Tag from '../../modules/hr/models/Tag';

class CacheWarmingService {
    async warmMasterDataCache() {
        console.log('🔥 Warming cache for master data...');

        const models = [
            { name: 'Divisi', model: Divisi },
            { name: 'Department', model: Department },
            { name: 'PosisiJabatan', model: PosisiJabatan },
            { name: 'StatusKaryawan', model: StatusKaryawan },
            { name: 'LokasiKerja', model: LokasiKerja },
            { name: 'Tag', model: Tag },
        ];

        for (const { name, model } of models) {
            try {
                const data = await model.findAll();
                await cacheService.set(`master_data:${name}:all`, data, 3600);
            } catch (error) {
                console.error(`Failed to warm cache for ${name}:`, error);
            }
        }

        console.log('✅ Cache warming completed');
    }
}

export default new CacheWarmingService();
