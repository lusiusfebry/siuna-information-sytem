import BaseMasterDataService from '../../../shared/services/base-master-data.service';

const CODE_PREFIX_MAP: Record<string, string> = {
    'FacilityBuilding': 'FBD',
    'FacilityRoomType': 'FRT',
    'FacilityRoom': 'FRM',
    'FacilityMaintenanceCategory': 'FMC',
};

const MODEL_SLUG_MAP: Record<string, string> = {
    'FacilityBuilding': 'building',
    'FacilityRoomType': 'room-type',
    'FacilityRoom': 'room',
    'FacilityMaintenanceCategory': 'maintenance-category',
};

class FacilityMasterDataService extends BaseMasterDataService {
    constructor() {
        super({
            codePrefixMap: CODE_PREFIX_MAP,
            modelSlugMap: MODEL_SLUG_MAP,
            cacheNamespace: 'facility_master_data',
            apiBase: 'facility',
        });
    }
}

export default new FacilityMasterDataService();
