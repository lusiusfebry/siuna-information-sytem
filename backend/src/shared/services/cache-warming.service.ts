import cacheService from './cache.service';

// NOTE: Redis is intentionally disabled (see src/config/redis.ts — the client is
// a no-op stub). Cache warming previously loaded every master-data table on boot
// and wrote it into the void, wasting startup queries and printing a misleading
// "cache warming completed". Until a real Redis client is wired up, this is a
// deliberate no-op so operational logs reflect reality.
class CacheWarmingService {
    async warmMasterDataCache() {
        void cacheService; // referenced so the module contract stays stable
        console.log('ℹ️  Cache is disabled (Redis not configured) — skipping cache warming.');
    }
}

export default new CacheWarmingService();
